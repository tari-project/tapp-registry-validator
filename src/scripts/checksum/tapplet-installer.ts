import fs from 'fs'
import path from 'path'
import axios, { AxiosError, AxiosResponse } from 'axios'
import * as zlib from 'zlib'
import * as tar from 'tar'
import { TappletCandidate } from 'src/types/tapplet'
import { getTappletCandidate } from '../tapplets/get-tapplet'
import { SRC_DIR } from 'src/constants'
import { getFileIntegrity } from './hash-calculator'

interface DownloadError {
  type: 'request' | 'io'
  message: string
}

interface FailedToDownload extends DownloadError {
  url: string
}

export async function downloadFile(
  folderPath: string,
  filePath: string,
  url: string
): Promise<void> {
  const client = axios.create()

  try {
    const response: AxiosResponse = await client.get(url, {
      responseType: 'arraybuffer' // Set responseType to 'arraybuffer' to download as a binary file
    })

    if (response.status >= 200 && response.status < 300) {
      await fs.promises.mkdir(folderPath, { recursive: true })
      await fs.promises.writeFile(filePath, response.data, 'binary')
    } else {
      const err: FailedToDownload = {
        type: 'request',
        message: 'Failed to download the tarball',
        url
      }
      console.error(err)
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      const err: FailedToDownload = {
        type: 'request',
        message: 'Failed to download the file',
        url
      }
      console.error(err)
    } else {
      const err: DownloadError = {
        type: 'request',
        message: 'Failed to download the file'
      }
      console.error(err)
    }
  }
}

export async function extractTarball(
  folderPath: string,
  filePath: string
): Promise<void> {
  try {
    const outputDir = await fs.promises.mkdir(
      path.join(folderPath, 'package'),
      {
        recursive: true
      }
    )

    const gunzip = zlib.createGunzip({})
    const extract = tar.extract({
      C: outputDir,
      strip: 1 // strip one level of directory hierarchy from archive
    })

    const tarballReadStream = fs.createReadStream(filePath)

    return new Promise((resolve, reject) => {
      tarballReadStream
        .pipe(gunzip)
        .on('error', err => {
          console.error('Error gunzipping tarball:', err)
          gunzip.destroy()
          tarballReadStream.destroy()
          reject(err)
        })
        .pipe(extract)
        .on('error', err => {
          console.error('Error extracting tarball:', err)
          gunzip.destroy()
          tarballReadStream.destroy()
          reject(err)
        })
        .on('finish', () => {
          console.log('Tarball extracted successfully')
          resolve()
        })
    })
  } catch (err) {
    console.error(`Error extracting tarball: ${err}`)
  }
}

export async function downloadAndExtractPackage(
  packageName: string
): Promise<TappletCandidate> {
  // Read the content of the tapplet manifest to be registered
  const tapplet: TappletCandidate = getTappletCandidate(packageName)

  const folderPath = path.join(SRC_DIR, tapplet.packageName, tapplet.version)
  const filePath = path.join(folderPath, `${tapplet.packageName}.tar.gz`)

  await downloadFile(
    folderPath,
    filePath,
    tapplet.source.location.npm.distTarball
  )
  await extractTarball(folderPath, filePath)

  // Validate checksum
  const calculatedIntegrity = await getFileIntegrity(filePath)
  if (calculatedIntegrity !== tapplet.source.location.npm.integrity)
    throw new Error(
      `The integrity mismatch! Calculated (${calculatedIntegrity}) is different from the registry value (${tapplet.source.location.npm.integrity})`
    )

  //TODO remove folder after was extracted and checked
  removeFolderRecursive(folderPath)

  return tapplet
}

function removeFolderRecursive(folderPath: string): void {
  if (!fs.existsSync(folderPath)) {
    throw new Error(`Folder '${folderPath}' does not exist`)
  }

  const files = fs.readdirSync(folderPath)

  files.forEach(file => {
    const filePath = path.join(folderPath, file)
    const stats = fs.statSync(filePath)

    if (stats.isDirectory()) {
      removeFolderRecursive(filePath)
    } else {
      fs.unlinkSync(filePath)
    }
  })

  fs.rmdirSync(folderPath)
}
