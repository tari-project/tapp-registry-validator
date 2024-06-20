import * as core from '@actions/core'
import { addTappletToRegistry } from './registry'
import { downloadAndExtractPackage } from './scripts/checksum/tapplet-installer'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const packageName: string = core.getInput('package-name')
    core.notice(`The ${packageName} tapplet registration process started...`)
    // const url: string = core.getInput('package-url')
    // const downloadPath = path.resolve('src', 'tapplet-candidate')

    // Download the tapplet package and extract to verify the content
    const tappletCandidate = await downloadAndExtractPackage(packageName)
    core.notice(`The ${tappletCandidate.displayName} tapplet extracted`)

    // Add new tapplet to the registry
    await addTappletToRegistry(tappletCandidate)
    core.notice(`The ${tappletCandidate.displayName} tapplet added to registry`)

    // Set outputs for other workflow steps to use
    core.setOutput('status', true)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
