import { VersionStruct } from '@metamask/utils'
import {
  object,
  record,
  string,
  optional,
  enums,
  Infer,
  pattern,
  array
} from 'superstruct'
import { AuthorStruct, CategoryEnums } from './tapp-registry'

export const AssetsPathStruct = pattern(
  string(),
  /\.\/assets\/.*\/\d+\.(?:png|jpe?g)$/u
)

export const AboutStruct = object({
  summary: string(),
  description: string()
})
export type About = Infer<typeof AboutStruct>

export const DesignStruct = object({
  logoPath: AssetsPathStruct,
  backgroundPath: AssetsPathStruct
})
export type Design = Infer<typeof DesignStruct>

export const RepositoryStruct = object({
  type: string(),
  url: string(),
  codeowners: array(string())
})
export type Repository = Infer<typeof RepositoryStruct>

export const LocationStruct = object({
  packageName: string(),
  registry: string()
})
export const SourceStruct = object({
  location: record(enums(['npm']), LocationStruct)
})

export const StatusEnums = enums(['WIP', 'MVP', 'PROD'])

export const TappletCandidateStruct = object({
  packageName: string(),
  displayName: string(),
  version: string(),
  status: optional(StatusEnums),
  category: optional(CategoryEnums),
  author: optional(AuthorStruct),
  about: AboutStruct,
  design: DesignStruct,
  repository: RepositoryStruct,
  source: SourceStruct,
  manifestVersion: VersionStruct
})
export type TappletCandidate = Infer<typeof TappletCandidateStruct>
