export type ContentItem = {
  id: string;
  kind: "image" | "text";
  title: string;
  text?: string;
  imageUrl?: string;
  fileName?: string;
  createdAt: string;
};

export type TemplateKind = "cover" | "content" | "divider" | "publish";

export type TemplateBinding =
  | "text"
  | "file"
  | "rowGallery"
  | "columnGallery"
  | "unknown";

export type TemplateParameterDefinition = {
  binding: TemplateBinding;
  type: string;
  required: boolean;
  description?: string;
  default?: string | boolean | number | null;
  itemType?: string;
  minItems?: number;
};

export type TemplateParameterValue =
  | string
  | boolean
  | number
  | string[]
  | null;

export type TemplatePosition = {
  x: number;
  y: number;
};

export type TemplateLayoutElement = {
  element_id: string;
  groupName?: string;
  type: string;
  text?: string;
  imageSource?: string;
  fileName?: string;
  photos?: string;
  tag?: string;
  fit?: string;
  graphicType?: string;
  position: TemplatePosition;
  width?: number;
  height?: number;
  backgroundColor?: string;
  color?: string;
  cornerRadius?: number;
  fontFamily?: string;
  fontSize?: number;
  textAlignment?: string;
  verticalAlignment?: string;
  textBrush?: string;
  textBold?: boolean;
  textLineHeight?: number;
  textOffset?: number;
  visible?: string | boolean;
  isDynamic?: boolean;
  splittable?: boolean;
  container?: {
    maxWidth?: number;
    maxHeight?: number;
    itemGap?: number;
    padding?: number;
    row?: {
      maxHeight?: number;
      fillMiddle?: boolean;
    };
  };
  frame?: {
    cornerRadius?: number;
  };
};

export type TemplateLayout = {
  width: number;
  height: number;
  backgroundColor?: string;
  elements: TemplateLayoutElement[];
};

export type TemplateLayoutRules = {
  flow?: {
    columns?: number;
    columnGap?: number;
    itemSpacing?: {
      size?: number;
    };
  };
  margin?: {
    pageMargin?: {
      spine?: number;
      fore?: number;
      head?: number;
      tail?: number;
    };
  };
  shiftUpOnHide?: boolean;
};

export type TemplateBaseLayer = {
  odd?: {
    elements: TemplateLayoutElement[];
  };
  even?: {
    elements: TemplateLayoutElement[];
  };
};

export type TemplateSchema = {
  id: string;
  name: string;
  description: string;
  templateKind: TemplateKind;
  theme: string;
  bookSpecId: string;
  category?: string | null;
  thumbnailUrl?: string;
  parameterDefinitions: Record<string, TemplateParameterDefinition>;
  layout: TemplateLayout;
  layoutRules?: TemplateLayoutRules;
  baseLayer?: TemplateBaseLayer;
};

export type TemplateVariant = {
  id: string;
  name: string;
  description: string;
  templateKind: TemplateKind;
  theme: string;
  bookSpecId: string;
  category?: string | null;
  thumbnailUrl?: string;
};

export type TemplateOption = {
  id: string;
  name: string;
  description: string;
  accentColor: string;
  coverLabel: string;
  theme: string;
  bookSpecIds: string[];
  templateKinds: TemplateKind[];
  templateCount: number;
  variants: TemplateVariant[];
  thumbnailUrl?: string;
};

export type CatalogSummary = {
  totalTemplates: number;
  familyCount: number;
  templateKindCount: number;
  templateKinds: TemplateKind[];
};

export type SchemaGeneratedPage = {
  id: string;
  sectionId: string;
  pageNumber: number;
  kind: "cover" | "divider" | "content" | "publish";
  templateUid: string;
  templateName: string;
  schema: TemplateSchema;
  parameters: Record<string, TemplateParameterValue>;
  assignedContentItemIds: string[];
};

export type GeneratedPage = SchemaGeneratedPage;

export type GeneratedSection = {
  id: string;
  title: string;
  intro: string;
  coverText: string;
  pages: GeneratedPage[];
};

export type BookSpecOption = {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  minPages: number;
  maxPages: number;
  pageStep: number;
};

export type Estimate = {
  currency: "KRW";
  quantity: number;
  unitPrice: number;
  shippingFee: number;
  subtotal: number;
  total: number;
  note: string;
};

export type ShippingInfo = {
  recipientName: string;
  recipientPhone: string;
  postalCode: string;
  address1: string;
  address2: string;
  memo: string;
};

export type OrderItem = {
  itemUid: string;
  bookUid: string;
  bookTitle: string;
  quantity: number;
  unitPrice: number;
  itemAmount: number;
  itemStatus: number;
  itemStatusDisplay: string;
};

export type Order = {
  orderUid: string;
  orderStatus: number;
  orderStatusDisplay: string;
  totalAmount: number;
  totalProductAmount: number;
  totalShippingFee: number;
  recipientName: string;
  recipientPhone: string;
  postalCode: string;
  address1: string;
  address2: string;
  shippingMemo: string;
  orderedAt: string;
  items: OrderItem[];
  isTest?: boolean;
};

export type ProjectWebhookEvent = {
  id: string;
  event: string;
  label: string;
  receivedAt: string;
  orderUid?: string;
  bookUid?: string;
  trackingNumber?: string;
};

export type ProjectStatus =
  | "draft"
  | "generated"
  | "ready_to_publish"
  | "published"
  | "ordered";

export type Project = {
  id: string;
  title: string;
  templateId: string;
  bookSpecId: string;
  coverImageUrl?: string;
  contentItems: ContentItem[];
  generatedSections: GeneratedSection[];
  status: ProjectStatus;
  sweetbookBookUid?: string;
  sweetbookOrderUid?: string;
  createdAt: string;
  updatedAt: string;
  estimate?: Estimate;
  order?: Order;
  webhookEvents?: ProjectWebhookEvent[];
};
