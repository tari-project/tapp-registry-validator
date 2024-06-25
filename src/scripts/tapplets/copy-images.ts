import * as fs from 'fs'
import * as path from 'path'

export function copyImages(sourcePath: string, destinationPath: string): void {
  const sourceFolder = path.join(sourcePath, 'src', 'images')
  const destinationFolder = path.join(destinationPath, 'images')

  // Create the destination folder if it doesn't exist
  if (!fs.existsSync(destinationFolder)) {
    fs.mkdirSync(destinationFolder)
  }

  // Get a list of files in the source folder
  const files = fs.readdirSync(sourceFolder)

  // Loop through each file
  files.forEach(file => {
    const filePath = path.join(sourceFolder, file)
    const fileExtension = path.extname(file).toLowerCase()

    // Check if the file is an image with.svg or.jpg or .png extension
    if (
      fileExtension === '.svg' ||
      fileExtension === '.jpg' ||
      fileExtension === '.png'
    ) {
      const destinationPath = path.join(destinationFolder, file)

      // Copy the file
      fs.copyFileSync(filePath, destinationPath)
      console.log(`Copied ${file} to ${destinationFolder}`)
    }
  })
}
