/* eslint-disable no-process-env */
import { inspect } from 'util'
import * as fs from 'fs'

import * as core from '@actions/core'

import { getAppropriateFormatter } from './formatters'

interface FileContentMapping {
  path: string
  contents: string
}

export function getFileContents(
  filePath?: string,
  defaultFileDetectionLocations: string[] = [
    'CODEOWNERS',
    'docs/CODEOWNERS',
    '.github/CODEOWNERS'
  ]
): FileContentMapping[] {
  let locationsToCheck = defaultFileDetectionLocations
  if (filePath && filePath.length > 0) {
    const thisPlatformPath = core.toPlatformPath(filePath)
    core.debug(`Using specified path: ${thisPlatformPath}`)

    locationsToCheck = [thisPlatformPath]
  } else {
    core.info(
      'Did not find specified input path, using default detection method.'
    )
  }
  const existingPaths = locationsToCheck.filter(path => {
    return fs.existsSync(path)
  })

  return existingPaths.map(path => {
    core.notice(`Found CODEOWNERS file at '${path}' to reformat.`)
    return {
      path,
      contents: fs.readFileSync(path, 'utf8')
    }
  })
}

export function formatContents(
  fileContents: FileContentMapping,
  formatType = 'lined-up',
  removeEmptyLines = true
): FileContentMapping {
  core.debug(`Using format type: ${formatType}`)
  const formatter = getAppropriateFormatter(formatType)
  const lines = fileContents.contents.split('\n')

  const lineLengths = lines
    .filter(line => {
      return !line.startsWith('#') && line.length > 0
    })
    .map(line => {
      const [path, ..._] = line.trim().split(/\s+/)
      return path.length
    })
  const maxLineLength = Math.max(...lineLengths)

  let formattedLines = lines.map(line => {
    return formatter.formatLine(line, maxLineLength)
  })

  if (removeEmptyLines) {
    core.debug('Removing empty lines...')
    formattedLines = formattedLines.filter(line => line.length > 0)
  }

  let newFormattedContents = formattedLines.join('\n')
  if (!newFormattedContents.endsWith('\n')) {
    newFormattedContents += '\n'
  }

  return {
    path: fileContents.path,
    contents: newFormattedContents
  }
}

export function writeToFile(
  fileContent: FileContentMapping,
  newFileName = 'CODEOWNERS'
): void {
  const newFilePath = fileContent.path.includes('/')
    ? `${fileContent.path.substring(0, fileContent.path.lastIndexOf('/'))}/${newFileName}`
    : fileContent.path

  fs.writeFileSync(newFilePath, fileContent.contents)
}

export function addAndFormatCodeowners(
  packageName: string,
  codeowners: string[]
): void {
  try {
    let currentCodeowners = getFileContents()
    if (currentCodeowners.length === 0) {
      const errorMsg = 'No CODEOWNERS file(s) found.'
      core.error(errorMsg)
      throw new Error(errorMsg)
    }

    const formattedCodeowners: FileContentMapping[] = currentCodeowners.map(
      fileContents => {
        if (codeowners.length > 0) {
          const packageDir = packageName.concat(
            packageName.endsWith('/') ? ' ' : '/ '
          )
          const codeownerFilePattern = packageDir.concat(codeowners.join(' '))
          if (fileContents.contents.includes(packageDir)) {
            const replacedContent = fileContents.contents.replace(
              new RegExp(`^${packageDir}.*$`, 'gm'),
              codeownerFilePattern
            )
            fileContents.contents = replacedContent
          } else {
            fileContents.contents =
              fileContents.contents.concat(codeownerFilePattern)
          }
        }

        return formatContents(fileContents)
      }
    )

    const changedFiles: string[] = []

    // TODO double check if any difference
    currentCodeowners = getFileContents()

    formattedCodeowners.forEach((fileContents, index) => {
      if (currentCodeowners[index].contents !== fileContents.contents) {
        core.notice(`Changed detected for '${fileContents.path}'.`)
        changedFiles.push(fileContents.path)
        writeToFile(fileContents, 'CODEOWNERS')
      } else {
        core.notice(`No changes detected for '${fileContents.path}'`)
      }
    })

    if (changedFiles.length > 0) {
      core.notice(`Made changes to the following files: ${changedFiles}`)
    } else {
      core.notice('No changes were made to any files.')
    }
  } catch (error: any) {
    core.debug(inspect(error))
    core.setOutput('success', false)
    core.setFailed(error.message)
  }
}
