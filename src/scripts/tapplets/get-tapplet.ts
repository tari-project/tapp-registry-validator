import * as core from '@actions/core'
import * as fs from 'fs'
import * as path from 'path'
import { SemVerVersion } from '@metamask/utils'
import { TappletCandidate } from 'src/types/tapplet'
import { RegisteredTapplet, TappletsRegistry } from 'src/types/tapp-registry'
import { IMAGES_DIR, SRC_DIR, VER_DIR } from 'src/constants'

export function fetchTappletCandidateData(
  tapplet: TappletCandidate
): RegisteredTapplet {
  const imagePath = path.join(SRC_DIR, tapplet.packageName, VER_DIR, IMAGES_DIR)

  const tappletToRegister: RegisteredTapplet = {
    id: tapplet.packageName,
    metadata: {
      displayName: tapplet.displayName,
      author: tapplet.author,
      codeowners: tapplet.repository.codeowners,
      audits: [],
      category: tapplet.category,
      logoPath: core.toPlatformPath(path.join(imagePath, 'logo.svg')),
      backgroundPath: core.toPlatformPath(
        path.join(imagePath, 'background.svg')
      )
    },
    versions: {
      [tapplet.version as SemVerVersion]: {
        integrity: tapplet.source.location.npm.integrity,
        registryUrl: tapplet.source.location.npm.distTarball
      }
    }
  }
  return tappletToRegister
}

export function getTappletCandidate(
  manifestFilePath: string
): TappletCandidate {
  core.notice(`Tapplet manifest file path: ${manifestFilePath}`)
  const tappData = fs.readFileSync(manifestFilePath, 'utf8')
  return JSON.parse(tappData)
}

export function getTappletRegistry(): TappletsRegistry {
  const manifestPath = path.resolve('tapplets-registry.manifest.json')
  const platformPath = core.toPlatformPath(manifestPath)
  core.notice(`Tapplet registry manifest file path: ${platformPath}`)
  const tappData = fs.readFileSync(platformPath, 'utf8')
  return JSON.parse(tappData)
}
