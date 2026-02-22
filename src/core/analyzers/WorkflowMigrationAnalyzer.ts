import type { ClassicWorkflow, MigrationRecommendation, MigrationFeature } from '../types/classicWorkflow.js';

/**
 * Analyzes classic workflows for migration complexity
 */
export class WorkflowMigrationAnalyzer {
  /**
   * Analyze classic workflow and provide migration recommendation
   * @param workflow Classic workflow to analyze
   * @returns Migration recommendation
   */
  analyze(workflow: ClassicWorkflow): MigrationRecommendation {
    const features = this.detectFeatures(workflow.xaml);
    const complexity = this.calculateComplexity(features, workflow);
    const effort = this.estimateEffort(complexity);
    const approach = this.generateApproach(workflow, features);
    const challenges = this.identifyChallenges(features);
    const advisory = this.generateAdvisory(workflow);

    return {
      complexity,
      effort,
      approach,
      challenges,
      features,
      documentationLink: 'https://learn.microsoft.com/en-us/power-automate/migrate-from-classic-workflows',
      advisory,
    };
  }

  /**
   * Detect features in XAML
   */
  private detectFeatures(xaml: string): MigrationFeature[] {
    const features: MigrationFeature[] = [];

    // Simple field updates
    if (xaml.includes('<UpdateEntity') || xaml.includes('SetState')) {
      features.push({
        feature: 'Field Updates',
        recommendation: 'Use Update Record action in Power Automate',
        migrationPath: 'Direct mapping - straightforward',
      });
    }

    // Wait conditions
    if (xaml.includes('<Wait') || xaml.includes('WaitCondition')) {
      features.push({
        feature: 'Wait Conditions',
        recommendation: 'Use Delay Until or Delay actions',
        migrationPath: 'Medium complexity - requires date/time logic',
      });
    }

    // Child workflows
    if (xaml.includes('<CallChildWorkflow')) {
      features.push({
        feature: 'Child Workflows',
        recommendation: 'Use nested flows or child flows',
        migrationPath: 'Complex - requires restructuring',
      });
    }

    // Custom workflow activities
    if (xaml.includes('CustomAssemblyActivity') || xaml.includes('CustomWorkflowActivity')) {
      features.push({
        feature: 'Custom Workflow Activities',
        recommendation: 'Requires custom connector or plugin conversion',
        migrationPath: 'Critical - may need code rewrite',
      });
    }

    // Email
    if (xaml.includes('SendEmail') || xaml.includes('<Email')) {
      features.push({
        feature: 'Send Email',
        recommendation: 'Use Send Email action',
        migrationPath: 'Direct mapping - straightforward',
      });
    }

    // Create record
    if (xaml.includes('<CreateEntity')) {
      features.push({
        feature: 'Create Record',
        recommendation: 'Use Create Record action',
        migrationPath: 'Direct mapping - straightforward',
      });
    }

    // Conditional branches
    if (xaml.includes('<Condition') || xaml.includes('ConditionalBranch')) {
      features.push({
        feature: 'Conditional Logic',
        recommendation: 'Use Condition actions',
        migrationPath: 'Medium complexity - requires expression mapping',
      });
    }

    // Assign record
    if (xaml.includes('<Assign') || xaml.includes('AssignEntity')) {
      features.push({
        feature: 'Assign Record',
        recommendation: 'Use Assign Record or Update Record (owner field)',
        migrationPath: 'Direct mapping - straightforward',
      });
    }

    // Status changes
    if (xaml.includes('SetState') || xaml.includes('SetStatus')) {
      features.push({
        feature: 'Status Changes',
        recommendation: 'Use Change Status action',
        migrationPath: 'Direct mapping - straightforward',
      });
    }

    // Stage changes (BPF)
    if (xaml.includes('SetProcess') || xaml.includes('SetStage')) {
      features.push({
        feature: 'Process/Stage Changes',
        recommendation: 'Use Change Stage or Switch Process actions',
        migrationPath: 'Medium complexity - BPF logic',
      });
    }

    // Deprecated features
    if (xaml.includes('Deprecated') || xaml.includes('Obsolete')) {
      features.push({
        feature: 'Deprecated Features',
        recommendation: 'Find alternative approach in Power Automate',
        migrationPath: 'Critical - no direct equivalent',
      });
    }

    // If no features detected, assume basic workflow
    if (features.length === 0) {
      features.push({
        feature: 'Basic Operations',
        recommendation: 'Standard Power Automate actions',
        migrationPath: 'Low complexity',
      });
    }

    return features;
  }

  /**
   * Calculate migration complexity
   */
  private calculateComplexity(
    features: MigrationFeature[],
    workflow: ClassicWorkflow
  ): 'Low' | 'Medium' | 'High' | 'Critical' {
    // Critical: Custom activities or deprecated features
    if (
      features.some((f) => f.feature.includes('Custom') || f.feature.includes('Deprecated'))
    ) {
      return 'Critical';
    }

    // High: Child workflows or complex wait conditions
    if (features.some((f) => f.feature.includes('Child Workflows') || f.feature.includes('Wait'))) {
      return 'High';
    }

    // High: Real-time workflows (synchronous) are more complex
    if (workflow.mode === 1) {
      return 'High';
    }

    // Medium: Multiple conditional branches or stage changes
    if (
      features.some((f) => f.feature.includes('Conditional') || f.feature.includes('Stage')) &&
      features.length > 3
    ) {
      return 'Medium';
    }

    // Low: Simple CRUD operations
    return 'Low';
  }

  /**
   * Estimate migration effort
   */
  private estimateEffort(complexity: string): string {
    switch (complexity) {
      case 'Critical':
        return '1+ weeks';
      case 'High':
        return '1-2 days';
      case 'Medium':
        return '4-8 hours';
      case 'Low':
      default:
        return '1-2 hours';
    }
  }

  /**
   * Generate migration approach
   */
  private generateApproach(workflow: ClassicWorkflow, features: MigrationFeature[]): string {
    const steps: string[] = [];

    steps.push('1. Create a new cloud flow in Power Automate');

    if (workflow.triggerOnCreate || workflow.triggerOnUpdate || workflow.triggerOnDelete) {
      steps.push(`2. Set trigger: When a row is ${this.getTriggerDescription(workflow)}`);
    } else if (workflow.onDemand) {
      steps.push('2. Set trigger: When a flow is run from the command bar');
    }

    steps.push('3. Add actions for each workflow step:');
    features.forEach((feature) => {
      steps.push(`   - ${feature.feature}: ${feature.recommendation}`);
    });

    steps.push('4. Test the flow thoroughly in development environment');
    steps.push('5. Deactivate the classic workflow');
    steps.push('6. Activate the new cloud flow');
    steps.push('7. Monitor for any issues and adjust as needed');

    return steps.join('\n');
  }

  /**
   * Get trigger description
   */
  private getTriggerDescription(workflow: ClassicWorkflow): string {
    const triggers: string[] = [];
    if (workflow.triggerOnCreate) triggers.push('added');
    if (workflow.triggerOnUpdate) triggers.push('modified');
    if (workflow.triggerOnDelete) triggers.push('deleted');
    return triggers.join(', ');
  }

  /**
   * Identify migration challenges
   */
  private identifyChallenges(features: MigrationFeature[]): string[] {
    const challenges: string[] = [];

    if (features.some((f) => f.feature.includes('Custom'))) {
      challenges.push('Custom workflow activities require code migration to custom connectors or plugins');
    }

    if (features.some((f) => f.feature.includes('Wait'))) {
      challenges.push('Wait conditions may behave differently in Power Automate (timezone handling, duration limits)');
    }

    if (features.some((f) => f.feature.includes('Child'))) {
      challenges.push('Child workflow logic needs to be reorganized as nested or child flows');
    }

    if (features.some((f) => f.feature.includes('Stage'))) {
      challenges.push('Business process flow stage changes require careful testing');
    }

    if (challenges.length === 0) {
      challenges.push('Standard workflow - migration should be straightforward');
    }

    return challenges;
  }

  /**
   * Generate migration advisory based on workflow mode
   */
  private generateAdvisory(workflow: ClassicWorkflow): string {
    // Real-time (synchronous) workflows - mode 1
    if (workflow.mode === 1 || workflow.modeName === 'RealTime') {
      return 'Advisory: Real-time workflows cannot be fully migrated to Power Automate cloud flows due to their synchronous nature. Consider using Dataverse plugins for synchronous business logic, or migrate to Power Automate with the understanding that flows are asynchronous and cannot block user operations.';
    }

    // Background (async) workflows - mode 0
    return 'Advisory: This async workflow can be migrated to Power Automate cloud flows. Classic workflows are deprecated, and migration is recommended to ensure continued support and access to modern features.';
  }
}
