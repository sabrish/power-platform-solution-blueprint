import {
  TextT20Regular,
  NumberSymbol20Regular,
  Calendar20Regular,
  Link20Regular,
  List20Regular,
  Checkmark20Regular,
  Image20Regular,
  Document20Regular,
  Money20Regular,
} from '@fluentui/react-icons';

export interface FieldTypeIconProps {
  attributeType: string;
  size?: number;
}

export function FieldTypeIcon({ attributeType, size = 20 }: FieldTypeIconProps) {
  const iconProps = { style: { fontSize: size } };

  switch (attributeType) {
    case 'String':
    case 'Memo':
      return <TextT20Regular {...iconProps} />;

    case 'Integer':
    case 'BigInt':
    case 'Decimal':
    case 'Double':
      return <NumberSymbol20Regular {...iconProps} />;

    case 'Money':
      return <Money20Regular {...iconProps} />;

    case 'DateTime':
      return <Calendar20Regular {...iconProps} />;

    case 'Lookup':
    case 'Owner':
    case 'Customer':
      return <Link20Regular {...iconProps} />;

    case 'Picklist':
    case 'State':
    case 'Status':
    case 'MultiSelectPicklist':
      return <List20Regular {...iconProps} />;

    case 'Boolean':
      return <Checkmark20Regular {...iconProps} />;

    case 'File':
    case 'Image':
      return <Image20Regular {...iconProps} />;

    default:
      return <Document20Regular {...iconProps} />;
  }
}
