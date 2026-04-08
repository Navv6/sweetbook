export type Crop = {
  x: number;
  y: number;
  scale: number;
};

export type ContentItem = {
  id: string;
  kind: "image" | "text";
  title: string;
  text?: string;
  imageUrl?: string;
  fileName?: string;
  createdAt: string;
};

export type TextRole =
  | "coverTitle"
  | "coverSubtitle"
  | "sectionTitle"
  | "intro"
  | "body"
  | "caption";

export type ImagePageElement = {
  id: string;
  type: "image";
  slotKey: string;
  contentItemId?: string;
  imageUrl: string;
  crop: Crop;
};

export type TextPageElement = {
  id: string;
  type: "text";
  role: TextRole;
  value: string;
};

export type PageElement = ImagePageElement | TextPageElement;

export type GeneratedPage = {
  id: string;
  sectionId: string;
  pageNumber: number;
  kind: "cover" | "intro" | "content";
  templateKey: "cover" | "intro" | "focus" | "story" | "gallery";
  elements: PageElement[];
};

export type GeneratedSection = {
  id: string;
  title: string;
  intro: string;
  coverText: string;
  pages: GeneratedPage[];
};

export type TemplateOption = {
  id: string;
  name: string;
  description: string;
  accentColor: string;
  coverLabel: string;
  thumbnailUrl?: string;
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
};
