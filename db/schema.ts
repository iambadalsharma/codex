import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const customers = sqliteTable("customers", {
  customerId: text("customer_id").primaryKey(),
  ownerName: text("owner_name").notNull(),
  businessName: text("business_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const customerTenders = sqliteTable("customer_tenders", {
  id: text("id").primaryKey(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.customerId, { onDelete: "cascade" }),
  serialNo: integer("serial_no").notNull(),
  remarks: text("remarks").notNull(),
  publishedDate: text("published_date").notNull(),
  submissionEndDate: text("submission_end_date").notNull(),
  preBidDate: text("pre_bid_date").notNull(),
  preBidLocation: text("pre_bid_location").notNull(),
  toBeApplied: text("to_be_applied").notNull(),
  notApplyingReason: text("not_applying_reason").notNull(),
  applied: text("applied").notNull(),
  dueDays: integer("due_days").notNull().default(0),
  tenderNumber: text("tender_number").notNull(),
  tenderTitle: text("tender_title").notNull(),
  consignee: text("consignee").notNull(),
  organisation: text("organisation").notNull(),
  location: text("location").notNull(),
  emdValue: text("emd_value").notNull(),
  ra: text("ra").notNull(),
  tenderValue: text("tender_value").notNull(),
  ourQuotedValue: text("our_quoted_value").notNull(),
  result: text("result").notNull(),
  winningValue: text("winning_value").notNull(),
  tenderLink: text("tender_link").notNull(),
  currentStatus: text("current_status").notNull(),
  folderLink: text("folder_link").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const customerOrders = sqliteTable("customer_orders", {
  id: text("id").primaryKey(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.customerId, { onDelete: "cascade" }),
  serialNo: integer("serial_no").notNull(),
  gemTenderReference: text("gem_tender_reference").notNull(),
  techSpecsReference: text("tech_specs_reference").notNull(),
  category: text("category").notNull(),
  contractNo: text("contract_no").notNull(),
  contractDate: text("contract_date").notNull(),
  organisation: text("organisation").notNull(),
  location: text("location").notNull(),
  work: text("work").notNull(),
  totalOrderValue: text("total_order_value").notNull(),
  orderStatus: text("order_status").notNull(),
  bgValue: text("bg_value").notNull(),
  bgNumber: text("bg_number").notNull(),
  bgIssueDate: text("bg_issue_date").notNull(),
  timelineOfBg: text("timeline_of_bg").notNull(),
  bgStatus: text("bg_status").notNull(),
  collectedOrNot: text("collected_or_not").notNull(),
  couriered: text("couriered").notNull(),
  cracLink: text("crac_link").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const tenderFiles = sqliteTable("tender_files", {
  id: text("id").primaryKey(),
  tenderId: text("tender_id")
    .notNull()
    .references(() => customerTenders.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(),
  uploadedAt: text("uploaded_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
