import type { BlueprintResult, ExternalEndpoint, ExternalCallSource, RiskFactor } from '../types/blueprint.js';

/**
 * Aggregates and risk-assesses all external API dependencies
 */
export class ExternalDependencyAggregator {
  /**
   * Aggregate all external dependencies with risk assessment
   */
  aggregateExternalDependencies(result: BlueprintResult): ExternalEndpoint[] {
    const endpointMap = new Map<string, ExternalEndpoint>();

    // Collect from flows
    for (const flow of result.flows) {
      if (!flow.definition.externalCalls || flow.definition.externalCalls.length === 0) {
        continue;
      }

      for (const call of flow.definition.externalCalls) {
        this.addOrUpdateEndpoint(endpointMap, call.domain, call.url, {
          type: 'Flow',
          name: flow.name,
          id: flow.id,
          entity: flow.entity,
          mode: 'Async', // Flows are always async
          confidence: call.confidence,
        });
      }
    }

    // Collect from web resources (JavaScript)
    for (const webResource of result.webResources) {
      if (!webResource.analysis?.externalCalls || webResource.analysis.externalCalls.length === 0) {
        continue;
      }

      for (const call of webResource.analysis.externalCalls) {
        this.addOrUpdateEndpoint(endpointMap, call.domain, call.url, {
          type: 'JavaScript',
          name: webResource.name,
          id: webResource.id,
          entity: null, // Web resources aren't tied to specific entities
          mode: 'Client', // JavaScript runs client-side
          confidence: call.confidence,
        });
      }
    }

    // Collect from classic workflows
    // TODO: Parse XAML for external calls (HTTP requests, web service calls)

    // Collect from custom APIs
    // Note: Custom APIs don't directly make external calls, but plugins backing them might
    // This would require analyzing plugin assemblies (not possible without code access)

    // Convert map to array and assess risks
    const endpoints = Array.from(endpointMap.values());

    // Assess risk for each endpoint
    for (const endpoint of endpoints) {
      endpoint.riskLevel = this.assessRiskLevel(endpoint.domain);
      endpoint.riskFactors = this.assessRiskFactors(endpoint);
    }

    // Sort by risk level (Critical > High > Medium > Low > Unknown > Known > Trusted)
    return endpoints.sort((a, b) => {
      const riskOrder = { 'Unknown': 0, 'Known': 1, 'Trusted': 2 };
      const aRiskValue = riskOrder[a.riskLevel];
      const bRiskValue = riskOrder[b.riskLevel];

      if (aRiskValue !== bRiskValue) {
        return aRiskValue - bRiskValue; // Lower value = higher risk
      }

      // Secondary sort by domain
      return a.domain.localeCompare(b.domain);
    });
  }

  /**
   * Add or update endpoint in map
   */
  private addOrUpdateEndpoint(
    endpointMap: Map<string, ExternalEndpoint>,
    domain: string,
    url: string,
    source: ExternalCallSource
  ): void {
    const normalizedDomain = domain.toLowerCase();

    if (!endpointMap.has(normalizedDomain)) {
      // Create new endpoint entry
      endpointMap.set(normalizedDomain, {
        url,
        domain: normalizedDomain,
        protocol: url.startsWith('https://') ? 'https' : 'http',
        riskLevel: 'Unknown', // Will be assessed later
        riskFactors: [],
        detectedIn: [source],
        callCount: 1,
      });
    } else {
      // Update existing endpoint
      const endpoint = endpointMap.get(normalizedDomain)!;
      endpoint.detectedIn.push(source);
      endpoint.callCount++;

      // Update protocol if current is HTTP and new is HTTPS
      if (endpoint.protocol === 'http' && url.startsWith('https://')) {
        endpoint.protocol = 'https';
      }
    }
  }

  /**
   * Assess risk level based on domain
   */
  private assessRiskLevel(domain: string): 'Trusted' | 'Known' | 'Unknown' {
    const normalizedDomain = domain.toLowerCase();

    // Trusted: Microsoft domains
    const trustedDomains = [
      'microsoft.com',
      'dynamics.com',
      'azure.com',
      'office.com',
      'office365.com',
      'microsoftonline.com',
      'windows.net',
      'powerapps.com',
      'powerplatform.com',
      'crm.dynamics.com',
    ];

    for (const trusted of trustedDomains) {
      if (normalizedDomain.endsWith(trusted) || normalizedDomain === trusted) {
        return 'Trusted';
      }
    }

    // Known: Whitelisted third parties
    const knownDomains = [
      'stripe.com',
      'twilio.com',
      'sendgrid.com',
      'mailchimp.com',
      'slack.com',
      'github.com',
      'googleapis.com',
      'cloudinary.com',
      'auth0.com',
      'okta.com',
      'salesforce.com',
      'hubspot.com',
      'zendesk.com',
      'intercom.io',
      'segment.com',
      'amplitude.com',
    ];

    for (const known of knownDomains) {
      if (normalizedDomain.endsWith(known) || normalizedDomain === known) {
        return 'Known';
      }
    }

    // Everything else is unknown
    return 'Unknown';
  }

  /**
   * Assess risk factors for endpoint
   */
  private assessRiskFactors(endpoint: ExternalEndpoint): RiskFactor[] {
    const factors: RiskFactor[] = [];

    // Check for HTTP (insecure protocol)
    if (endpoint.protocol === 'http') {
      factors.push({
        severity: 'High',
        factor: 'Insecure Protocol',
        description: 'Endpoint uses HTTP instead of HTTPS, exposing data to interception',
        recommendation: 'Migrate to HTTPS to ensure data is encrypted in transit',
      });
    }

    // Check for synchronous calls (blocking transaction)
    const hasSyncCall = endpoint.detectedIn.some(source => source.mode === 'Sync');
    if (hasSyncCall) {
      factors.push({
        severity: 'Critical',
        factor: 'Synchronous External Call',
        description: 'External call is made from synchronous plugin, blocking the database transaction',
        recommendation: 'Move external calls to asynchronous plugins or flows to avoid transaction locks and timeouts',
      });
    }

    // Check for client-side calls (potential CORS issues, exposed credentials)
    const hasClientCall = endpoint.detectedIn.some(source => source.mode === 'Client');
    if (hasClientCall) {
      factors.push({
        severity: 'Medium',
        factor: 'Client-Side Call',
        description: 'External call is made from client-side JavaScript, exposing the endpoint to end users',
        recommendation: 'Consider moving sensitive API calls to server-side (plugins/flows) to protect credentials and reduce CORS issues',
      });
    }

    // Check for unknown domains
    if (endpoint.riskLevel === 'Unknown') {
      factors.push({
        severity: 'Medium',
        factor: 'Unknown Endpoint',
        description: 'External endpoint is not from a trusted or known provider',
        recommendation: 'Verify the endpoint is legitimate, review security practices, and document the integration',
      });
    }

    // Check for high call count (potential performance impact)
    if (endpoint.callCount >= 5) {
      factors.push({
        severity: 'Low',
        factor: 'High Call Frequency',
        description: `Endpoint is called from ${endpoint.callCount} different automation components`,
        recommendation: 'Consider caching or consolidating calls to reduce external dependencies',
      });
    }

    // Sort by severity
    const severityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
    return factors.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }
}
