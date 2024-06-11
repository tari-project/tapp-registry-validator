import fs from 'fs'
import path from 'path'
import axios, { AxiosError, AxiosResponse } from 'axios'
import * as zlib from 'zlib'
import * as tar from 'tar'
import { TappletCandidate } from 'src/types/tapplet'

interface DownloadError {
  type: 'request' | 'io'
  message: string
}

interface FailedToDownload extends DownloadError {
  url: string
}

export async function downloadFile(
  tappletPath: string,
  filePath: string,
  url: string
): Promise<void> {
  console.log('Downloading in progress...! Url:', url)
  const client = axios.create()

  try {
    const response: AxiosResponse = await client.get(url, {
      responseType: 'arraybuffer' // Set responseType to 'arraybuffer' to download as a binary file
    })

    if (response.status >= 200 && response.status < 300) {
      await fs.promises.mkdir(tappletPath, { recursive: true })
      await fs.promises.writeFile(filePath, response.data, 'binary')
      console.log(`Downloaded tarball successfully: ${filePath}`)
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
  tappletPath: string,
  filePath: string
): Promise<void> {
  try {
    const outputDir = await fs.promises.mkdir(
      path.join(tappletPath, 'package'),
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
  tapplet: TappletCandidate
): Promise<void> {
  const tappletPath = `src/${tapplet.packageName}`
  const filePath = path.join(tappletPath, `${tapplet.packageName}.tar.gz`)
  const url = `${tapplet.source.location.npm.registry}/${tapplet.packageName}/-/${tapplet.packageName}-${tapplet.version}.tgz`

  await downloadFile(tappletPath, filePath, url)
  await extractTarball(tappletPath, filePath)
}
