import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const devices = sqliteTable('devices', {
  id: text('id').primaryKey(),
  secretHash: text('secret_hash').notNull(),
  name: text('name').notNull(),
  pairId: text('pair_id'),
  lastSeen: integer('last_seen').notNull(),
  userId: text('user_id'),
  revokedAt: integer('revoked_at'),
}, (table) => [index('idx_devices_pair_id').on(table.pairId), index('idx_devices_user_id').on(table.userId)])

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  recoveryHash: text('recovery_hash').unique(),
  email: text('email').unique(),
  passwordHash: text('password_hash'),
  passwordSalt: text('password_salt'),
  resetTokenHash: text('reset_token_hash').unique(),
  resetExpiresAt: integer('reset_expires_at'),
  pairId: text('pair_id'),
  name: text('name').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => [index('idx_users_pair_id').on(table.pairId)])

export const pairCodes = sqliteTable('pair_codes', {
  code: text('code').primaryKey(),
  deviceId: text('device_id').notNull(),
  expiresAt: integer('expires_at').notNull(),
}, (table) => [index('idx_pair_codes_expires_at').on(table.expiresAt)])

export const pushSubscriptions = sqliteTable('push_subscriptions', {
  deviceId: text('device_id').primaryKey(),
  endpoint: text('endpoint').notNull(),
  createdAt: integer('created_at').notNull(),
})

export const pushSubscriptionsV2 = sqliteTable('push_subscriptions_v2', {
  id: text('id').primaryKey(),
  deviceId: text('device_id').notNull(),
  endpoint: text('endpoint').notNull().unique(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => [index('idx_push_subscriptions_v2_device').on(table.deviceId)])

export const partnerEvents = sqliteTable('partner_events', {
  id: text('id').primaryKey(),
  senderDeviceId: text('sender_device_id').notNull(),
  receiverDeviceId: text('receiver_device_id').notNull(),
  type: text('type').notNull(),
  payload: text('payload').notNull(),
  createdAt: integer('created_at').notNull(),
  delivered: integer('delivered').notNull().default(0),
}, (table) => [index('idx_partner_events_receiver_delivery').on(table.receiverDeviceId, table.delivered, table.createdAt)])

export const eventNotificationClaims = sqliteTable('event_notification_claims', {
  eventId: text('event_id').notNull(),
  deviceId: text('device_id').notNull(),
  notifiedAt: integer('notified_at').notNull(),
}, (table) => [
  primaryKey({ columns: [table.eventId, table.deviceId] }),
  index('idx_event_notification_claims_device').on(table.deviceId, table.notifiedAt),
])

export const sharedState = sqliteTable('shared_state', {
  deviceId: text('device_id').primaryKey(),
  payload: text('payload').notNull(),
  updatedAt: integer('updated_at').notNull(),
})
