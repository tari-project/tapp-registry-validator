import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import * as base64 from 'base64-js'

class CustomError extends Error {
  constructor(
    public IOError: {
      FailedToReadDir: { path: string }
      FailedToReadFile: { path: string }
      ParseIntError: Error
    }
  ) {
    super()
  }
}

function calculateHash(data: Buffer, sha: number): string {
  switch (sha) {
    case 224:
      return crypto.createHash('sha224').update(data).digest('hex')
    case 256:
      return crypto.createHash('sha256').update(data).digest('hex')
    case 384:
      return crypto.createHash('sha384').update(data).digest('hex')
    case 512:
      return crypto.createHash('sha512').update(data).digest('hex')
    default:
      return crypto.createHash('sha1').update(data).digest('hex')
  }
}

async function readData(filePath: string, sha: number): Promise<string> {
  return new Promise((resolve, reject) => {
    if (fs.lstatSync(filePath).isDirectory()) {
      fs.readdir(filePath, (err, files) => {
        if (err) {
          reject(new Error())
        } else {
          const results: string[] = []
          files.forEach(file => {
            const fullFilePath = path.join(filePath, file)
            if (fs.lstatSync(fullFilePath).isFile()) {
              fs.readFile(fullFilePath, (err, data) => {
                if (err) {
                  reject(new Error())
                } else {
                  const hash = calculateHash(data, sha)
                  results.push(`${hash}    ${fullFilePath}`)
                }
              })
            }
          })
          resolve(results.join('\n'))
        }
      })
    } else {
      fs.readFile(filePath, (err, data) => {
        if (err) {
          reject(new Error())
        } else {
          const hash = calculateHash(data, sha)
          resolve(hash)
        }
      })
    }
  })
}

function decodeHex(s: string): Buffer {
  const buffer = Buffer.alloc(s.length / 2)
  for (let i = 0; i < s.length; i += 2) {
    buffer[i / 2] = parseInt(s.substring(i, i + 2), 16)
  }
  return buffer
}

export async function getFileIntegrity(
  filePath: string,
  sha = 512
): Promise<string> {
  const shasumOutput = await readData(filePath, sha)
  const decodedShasum = decodeHex(shasumOutput)
  const convertedShasum = base64.fromByteArray(decodedShasum)

  const calculatedIntegrity = `sha${sha}-${convertedShasum.replace(/\n/g, '')}`
  return calculatedIntegrity
}
