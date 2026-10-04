import type { CollectionSchema } from 'deepspace/schema'

export const auditsSchema: CollectionSchema = {
  name: 'audits',
  columns: [
    { name: 'title', storage: 'text', interpretation: 'plain' },
    { name: 'repoUrl', storage: 'text', interpretation: 'url' },
    { name: 'siteUrl', storage: 'text', interpretation: 'url' },
    { name: 'jobId', storage: 'text', interpretation: 'plain' },
    { name: 'result', storage: 'text', interpretation: { kind: 'json' } },
    { name: 'decision', storage: 'text', interpretation: 'plain' },
  ],
  permissions: {
    viewer: { read: false, create: false, update: false, delete: false },
    member: { read: 'own', create: true, update: 'own', delete: 'own' },
    admin: { read: true, create: true, update: true, delete: true },
  },
}
