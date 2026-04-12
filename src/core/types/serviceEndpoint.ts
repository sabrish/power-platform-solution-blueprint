/**
 * Service Endpoint / Webhook types
 */

/**
 * Contract type for a service endpoint.
 * Maps the `contract` integer field from the Dataverse `serviceendpoints` entity.
 *   1 = OneWay, 2 = Queue, 3 = SendAndReceive, 8 = EventHub, 9 = Webhook
 */
export type ServiceEndpointContract =
  | 'OneWay'
  | 'Queue'
  | 'SendAndReceive'
  | 'EventHub'
  | 'Webhook'
  | 'Unknown';

/**
 * A service endpoint registered on Dataverse — Service Bus queues, Event Hubs, or Webhooks.
 * Component type code: 95 (Service Endpoint) — Strategy A discovery via solutioncomponents.
 */
export interface ServiceEndpoint {
  id: string;
  name: string;
  description: string | null;
  contract: ServiceEndpointContract;
  connectionMode: string;
  messageFormat: string;
  /** Endpoint URL — may be null for queue-type endpoints where the URL is in the connection string */
  url: string | null;
  isManaged: boolean;
  createdOn: string;
  modifiedOn: string;
  /** Number of SDK message processing steps registered against this endpoint */
  registeredStepCount: number;
}
