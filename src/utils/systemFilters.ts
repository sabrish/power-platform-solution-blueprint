/**
 * System entity and relationship filters
 * Shared utility to ensure consistent filtering across ERD, dbdiagram exports, and UI views
 */
import type { EntityBlueprint } from '../core/types/blueprint.js';

// ---------------------------------------------------------------------------
// Platform entity exclusion list
// ---------------------------------------------------------------------------
// These entities are Dataverse platform infrastructure. They are excluded from
// the ERD by default UNLESS a scoped entity has a custom relationship
// (IsCustomRelationship === true) connecting it to one of them.
//
// NEVER add to this list: customapi, customapirequestparameter,
// customapiresponseproperty — these are user-created solution components.
// ---------------------------------------------------------------------------

const SYSTEM_ENTITY_NAMES: readonly string[] = [
  // --- Core platform identity / ownership ---
  'systemuser', 'team', 'businessunit', 'organization', 'transactioncurrency', 'owner',

  // --- Security and access control ---
  'role', 'roleprivileges', 'privilege', 'systemuserroles', 'teamroles',
  'fieldsecurityprofile', 'fieldpermission', 'principalobjectaccess',
  'principalobjectattributeaccess', 'roletemplate', 'teamtemplate',
  'accessteammember', 'accessteamtemplate', 'accessteamtemplatem2m',
  'systemuserauthorizationchangetracker', 'usersettings', 'userform',
  'userentityinstancedata', 'userentityuisettings',
  'channelaccessprofile', 'channelaccessprofilerule', 'channelaccessprofileruleitem',
  'externalparty', 'externalpartyitem',

  // --- Async execution and process infrastructure ---
  'asyncoperation', 'processsession', 'process', 'workflow', 'workflowlog',
  'workflowdependency', 'workflowbinary', 'processstage', 'processtrigger',
  'processdependency', 'bulkdeletefailure', 'bulkdeleteoperation', 'importjob',
  'syncerror', 'flowsession', 'flowrun', 'flowmachine', 'flowmachinegroup',
  'flowmachinenetwork', 'workqueue', 'workqueueitem', 'desktopflowmodule', 'desktopflowbinary',

  // --- Activity infrastructure ---
  'activitypointer', 'activityparty', 'activitymimeattachment',
  'email', 'task', 'phonecall', 'fax', 'letter', 'appointment',
  'socialactivity', 'recurringappointmentmaster',

  // --- Email and messaging infrastructure ---
  'mailbox', 'emailserverprofile', 'attachment', 'mailmergetemplate',
  'emailhash', 'emailsignature',

  // --- Solution, deployment and metadata housekeeping ---
  'solution', 'solutioncomponent', 'solutionhistorydata',
  'solutioncomponentattributeconfiguration', 'solutioncomponentsummary',
  'solutioncomponentrelationshipconfiguration', 'stagesolutionupload',
  'exportsolutionupload', 'featurecontrolsetting', 'packagehistory',
  'publisher', 'dependency', 'dependencynode', 'invaliddependency',

  // --- Customisation and UI metadata ---
  'systemform', 'savedquery', 'userquery', 'savedqueryvisualization',
  'userqueryvisualization', 'sitemap', 'appmodule', 'appmodulecomponent',
  'appconfig', 'appconfigmaster', 'appconfiginstance', 'ribbon',
  'ribbonmetadatatocachekeys', 'ribbonclientmetadatadeclared',
  'displaystring', 'displaystringmap', 'hierarchyrule', 'hierarchysecurityconfiguration',

  // --- Data import infrastructure ---
  'importmap', 'import', 'importfile', 'importdata', 'importlog',
  'columnmapping', 'lookupmapping', 'ownermapping',
  'transformationparametermapping', 'transformationmapping',
  'picklistmapping', 'bulkoperationlog', 'dataperformance',

  // --- Duplicate detection ---
  'duplicaterule', 'duplicaterulecondition', 'duplicaterecord',

  // --- Queue infrastructure ---
  'queue', 'queueitem',

  // --- Plugin and SDK registration ---
  'serviceendpoint', 'sdkmessageprocessingstep', 'sdkmessageprocessingstepimage',
  'pluginassembly', 'sdkmessage', 'sdkmessagefilter', 'plugintracelog', 'tracelog',

  // --- Audit and logging ---
  'audit',

  // --- Scheduling and calendar ---
  'calendar', 'calendarrule', 'resourcespec', 'resource', 'resourcegroup',
  'service', 'site', 'equipment', 'constraintbasedgroup',

  // --- Knowledge base ---
  'kbarticle', 'kbarticletemplate', 'kbarticlecomment', 'knowledgebaserecord',
  'knowledgearticleviews', 'knowledgearticleincident', 'knowledgesearchmodel',

  // --- Connections ---
  'connection', 'connectionrole', 'connectionroleobjecttypecode',

  // --- Mobile offline ---
  'mobileofflineprofile', 'mobileofflineprofileitem',
  'mobileofflineprofileitemassociation', 'offlinecommanddefinition', 'syncconfiguration',

  // --- Notifications and activity feed ---
  'subscriptionsyncentryoffline', 'subscriptionsyncinfo',
  'postfollow', 'post', 'postregarding', 'postrole', 'postlike', 'postcomment',

  // --- UI and app config ---
  'theme', 'languagelocale', 'timezonelocalizedname', 'timezonedefinition',
  'timezonerule', 'usermapping', 'report', 'reportcategory', 'reportentity',
  'reportlink', 'reportvisibility',

  // --- Virtual entity metadata ---
  'virtualentitymetadata', 'entitydatasource', 'entityrecordfilter',

  // --- AI Builder (platform-managed) ---
  'msdyn_aimodel', 'msdyn_aiconfiguration', 'msdyn_aitemplate',
  'msdyn_aifptrainingdocument', 'msdyn_aiodimage', 'msdyn_aiodlabel',
  'msdyn_aiodtrainingboundingbox', 'msdyn_aiodtrainingimage',
  'msdyn_aibdataset', 'msdyn_aibdatasetfile', 'msdyn_aibdatasetrecord',
  'msdyn_aibfile', 'msdyn_aibfileattacheddata',

  // --- Power Pages / Portal infrastructure ---
  'powerpagecomponent', 'powerpagesite', 'powerpagesitelanguage',
  'powerpagesitepublished', 'powerpagesscanreport', 'mspp_website', 'mspp_webpage',
];

/**
 * O(1) lookup set. Populated once at module load; all values already lowercase.
 */
const SYSTEM_ENTITIES_SET: Set<string> = new Set(SYSTEM_ENTITY_NAMES);

/**
 * Readonly array export for backward compatibility.
 */
export const SYSTEM_ENTITIES: readonly string[] = SYSTEM_ENTITY_NAMES;

// ---------------------------------------------------------------------------
// Entity-level predicate
// ---------------------------------------------------------------------------

/**
 * Returns true when an entity is a Dataverse platform/infrastructure entity
 * that should be excluded from the ERD by default.
 *
 * NOTE: customapi, customapirequestparameter, and customapiresponseproperty
 * are intentionally NOT in this list — they are user-created solution components.
 */
export function isSystemEntity(entityLogicalName: string): boolean {
  return SYSTEM_ENTITIES_SET.has(entityLogicalName.toLowerCase());
}

// ---------------------------------------------------------------------------
// BPF entity predicate
// ---------------------------------------------------------------------------

/**
 * Returns true when an entity is the auto-generated tracking entity created by
 * a Business Process Flow. BPF entities are always excluded from the ERD
 * regardless of whether they appear in the solution.
 *
 * @param entityLogicalName  The entity's logical name (case-insensitive).
 * @param bpfEntityNames     Set of BPF unique names (logical names), lower-cased.
 */
export function isBPFEntity(
  entityLogicalName: string,
  bpfEntityNames: ReadonlySet<string>
): boolean {
  return bpfEntityNames.has(entityLogicalName.toLowerCase());
}

// ---------------------------------------------------------------------------
// Custom-relationship guard
// ---------------------------------------------------------------------------

/**
 * Returns true when a platform entity has at least one custom relationship
 * (IsCustomRelationship === true) connecting it to an entity in the current
 * blueprint scope.
 *
 * Use as an override gate: if isSystemEntity() returns true, call this to
 * check whether the entity should still appear because of an explicit custom
 * relationship. IsCustomRelationship === undefined is treated as false.
 */
export function hasPlatformEntityCustomRelationship(
  platformEntityLogicalName: string,
  scopedEntities: EntityBlueprint[]
): boolean {
  const platformName = platformEntityLogicalName.toLowerCase();

  for (const { entity } of scopedEntities) {
    if (entity.OneToManyRelationships) {
      for (const rel of entity.OneToManyRelationships) {
        if (
          rel.IsCustomRelationship === true &&
          (rel.ReferencingEntity.toLowerCase() === platformName ||
            rel.ReferencedEntity.toLowerCase() === platformName)
        ) {
          return true;
        }
      }
    }
    if (entity.ManyToManyRelationships) {
      for (const rel of entity.ManyToManyRelationships) {
        if (
          rel.IsCustomRelationship === true &&
          (rel.Entity1LogicalName.toLowerCase() === platformName ||
            rel.Entity2LogicalName.toLowerCase() === platformName)
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Relationship-level predicate (unchanged)
// ---------------------------------------------------------------------------

/**
 * Returns true when a relationship is system-generated and should be suppressed
 * from ERD edges (createdby, modifiedby, currency, etc.).
 */
export function isSystemRelationship(
  schemaName: string,
  referencingAttribute?: string,
  referencedEntity?: string,
  referencingEntity?: string
): boolean {
  const lowerSchemaName = schemaName.toLowerCase();
  const lowerAttribute = referencingAttribute?.toLowerCase() ?? '';
  const lowerReferencedEntity = referencedEntity?.toLowerCase() ?? '';
  const lowerReferencingEntity = referencingEntity?.toLowerCase() ?? '';

  if (
    SYSTEM_ENTITIES_SET.has(lowerReferencedEntity) ||
    SYSTEM_ENTITIES_SET.has(lowerReferencingEntity)
  ) {
    return true;
  }

  const systemPatterns = [
    'createdby', 'modifiedby', 'createdonbehalfby', 'modifiedonbehalfby',
    'ownerid', 'owninguser', 'owningteam', 'owningbusinessunit',
    'transactioncurrencyid', 'transactioncurrency', '_transactioncurrency',
  ];

  return systemPatterns.some(
    pattern => lowerSchemaName.includes(pattern) || lowerAttribute.includes(pattern)
  );
}
