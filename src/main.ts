import * as core from '@actions/core'
import { addTappletToRegistry } from './registry'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const packageName: string = core.getInput('packageName')
    core.notice(`The ${packageName} tapplet registration process started...`)

    // Add new tapplet to the registry
    const ver: string = core.getInput('manifestVersion')
    addTappletToRegistry(ver, packageName)
    core.info('Registry updated.')

    // Set outputs for other workflow steps to use
    core.setOutput('status', true)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
