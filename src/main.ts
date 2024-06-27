import * as core from '@actions/core'
import { downloadAndExtractPackage } from './scripts/checksum/tapplet-installer'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const packageName: string = core.getInput('package-name')
    const packageVersion: string = core.getInput('package-version')
    core.notice(`The ${packageName} tapplet registration process started...`)

    // Download the tapplet package and extract to verify the content
    const tappletCandidate = await downloadAndExtractPackage(
      packageName,
      packageVersion
    )
    core.notice(`The ${tappletCandidate.displayName} tapplet extracted`)

    // Set outputs for other workflow steps to use
    core.setOutput('status', true)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
