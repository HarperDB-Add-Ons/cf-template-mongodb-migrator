import Ajv from 'ajv'

const ajv = new Ajv()

const jobLastDocumentSchema = {
  type: 'object',
  properties: {
    database: { type: 'string', minLength: 1 },
    collection: { type: 'string', minLength: 1 }
  },
  required: ['database', 'collection'],
  additionalProperties: false
}
const validateJobLastDocumentSchema = ajv.compile(jobLastDocumentSchema)

const createJobSchema = {
  type: 'object',
  properties: {
    configuration: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          source: {
            type: 'object',
            properties: {
              database: { type: 'string', minLength: 1 },
              collection: { type: 'string', minLength: 1 }
            },
            required: ['database', 'collection'],
            additionalProperties: false
          },
          target: {
            type: 'object',
            properties: {
              schema: { type: 'string', minLength: 1 },
              table: { type: 'string', minLength: 1 }
            },
            required: ['schema', 'table'],
            additionalProperties: false
          }
        },
        required: ['source', 'target'],
        additionalProperties: false
      },
      minItems: 1,
      uniqueItems: true
    },
    uri: { type: 'string', minLength: 1 }
  },
  required: ['uri', 'configuration'],
  additionalProperties: false
}
const validateJobCreateSchema = ajv.compile(createJobSchema)

export {
  validateJobCreateSchema,
  validateJobLastDocumentSchema
}
