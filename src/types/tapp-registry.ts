import { VersionStruct, base64 } from '@metamask/utils'
import {
  object,
  record,
  string,
  optional,
  refine,
  Infer,
  pattern,
  array,
  size,
  enums
} from 'superstruct'

// Validate that each tapplet use an NPM id.
const NpmIdStruct = refine(string(), 'Npm ID', value =>
  value.startsWith('npm:')
)

export const AuthorStruct = object({
  name: string(),
  website: string()
})
export type Author = Infer<typeof AuthorStruct>

export const AuditStruct = object({
  auditor: string(),
  report: string()
})
export type Audit = Infer<typeof AuditStruct>

export const ImagePathStruct = pattern(
  string(),
  /\.\/images\/.*\/\d+\.(?:png|jpe?g|svg)$/u
)

export const ChecksumStruct = size(
  base64(string(), { paddingRequired: true }),
  44,
  44
)

const RegisteredTappletVersionStruct = object({
  integrity: ChecksumStruct,
  registryUrl: string() // TODO check url http (like ImagePathStruct)
})

export const CategoryEnums = enums(['test', 'defi', 'gamefi', 'meme'])

export const RegisteredTappletStruct = object({
  id: NpmIdStruct,
  metadata: object({
    displayName: string(),
    author: optional(AuthorStruct),
    codeowners: array(string()),
    audits: optional(array(AuditStruct)),
    category: optional(CategoryEnums),
    logoPath: ImagePathStruct,
    backgroundPath: ImagePathStruct
  }),
  versions: record(VersionStruct, RegisteredTappletVersionStruct)
})
export type RegisteredTapplet = Infer<typeof RegisteredTappletStruct>

export const TappletRegistryStruct = object({
  manifestVersion: string(),
  registeredTapplets: record(NpmIdStruct, RegisteredTappletStruct)
})
export type TappletsRegistry = Infer<typeof TappletRegistryStruct>
