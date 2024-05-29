import * as core from '@actions/core'
import * as fs from 'fs'
import { SemVerVersion } from '@metamask/utils'
import { TappletCandidate } from 'src/types/tapplet'
import { RegisteredTapplet, TappletsRegistry } from 'src/types/tapp-registry'

export function fetchTappletCandidateData(
  tapplet: TappletCandidate
): RegisteredTapplet {
  const tappLogoPath = `src/registered-tapplets/${tapplet.packageName}/assets/logo.svg`
  const tappRegistryUrl = `${tapplet.source.location.npm.registry}/${tapplet.packageName}/-/${tapplet.packageName}-${tapplet.version}.tgz`

  const tappletToRegister: RegisteredTapplet = {
    id: tapplet.packageName,
    metadata: {
      displayName: tapplet.displayName,
      author: tapplet.author,
      codeowners: tapplet.repository.codeowners,
      audits: [],
      category: tapplet.category,
      logoPath: core.toPlatformPath(tappLogoPath)
    },
    versions: {
      [tapplet.version as SemVerVersion]: {
        //TODO calculate/check integrity
        integrity: 'sha512-test123test123test123==',
        registryUrl: tappRegistryUrl
      }
    }
  }

  return tappletToRegister
}

export function getTappletCandidate(packageName: string): TappletCandidate {
  const path = core.toPlatformPath(
    `./src/registered-tapplets/${packageName}/tapplet.manifest.json`
  )
  core.notice(`Tapplet manifest path: ${path}`)
  const tappData = fs.readFileSync(path, 'utf8')
  return JSON.parse(tappData)
}

export function getTappletRegistry(): TappletsRegistry {
  const path = core.toPlatformPath('./tapplets-registry.manifest.json')
  core.notice(`Tapplet registry manifest path: ${path}`)
  const tappData = fs.readFileSync(path, 'utf8')
  return JSON.parse(tappData)
}
