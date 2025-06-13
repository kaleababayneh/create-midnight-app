import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createMidnightApp(projectName, options) {
  const targetDir = path.resolve(process.cwd(), projectName);
  const templateDir = path.resolve(__dirname, '../templates/default');
  
  if (options.verbose) {
    console.log(chalk.gray(`Target directory: ${targetDir}`));
    console.log(chalk.gray(`Template directory: ${templateDir}`));
  }
  
  // Validate project name
  if (!/^[a-zA-Z0-9-_]+$/.test(projectName)) {
    throw new Error('Project name can only contain letters, numbers, hyphens, and underscores');
  }
  
  // Check if directory already exists
  if (await fs.pathExists(targetDir)) {
    throw new Error(`Directory ${projectName} already exists`);
  }
  
  // Check if template exists
  if (!(await fs.pathExists(templateDir))) {
    throw new Error('Template directory not found - this might be a corrupted installation');
  }
  
  console.log(chalk.blue(`📁 Creating Midnight project: ${chalk.bold(projectName)}`));
  console.log(chalk.gray(`📍 Location: ${targetDir}`));
  
  // Copy template with spinner
  const copySpinner = ora('📋 Copying project template...').start();
  try {
    await fs.copy(templateDir, targetDir);
    copySpinner.succeed('✅ Template copied successfully');
  } catch (error) {
    copySpinner.fail('❌ Failed to copy template');
    throw new Error(`Template copy failed: ${error.message}`);
  }
  
  // Update package.json with project name
  const updateSpinner = ora('📝 Updating project configuration...').start();
  try {
    const packageJsonPath = path.join(targetDir, 'package.json');
    
    if (!(await fs.pathExists(packageJsonPath))) {
      throw new Error('package.json not found in template');
    }
    
    const packageJson = await fs.readJson(packageJsonPath);
    packageJson.name = projectName;
    packageJson.description = `A Midnight smart contract project: ${projectName}`;
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    updateSpinner.succeed('✅ Project configuration updated');
  } catch (error) {
    updateSpinner.fail('❌ Failed to update project configuration');
    throw new Error(`Configuration update failed: ${error.message}`);
  }
  
  // Install dependencies (unless skipped)
  if (!options.skipInstall) {
    const installSpinner = ora('📦 Installing dependencies (this may take a few seconds)...').start();
    try {
      await installDependencies(targetDir, options.verbose);
      installSpinner.succeed('✅ Dependencies installed');
      
      // Fix TypeScript binary symlinks after installation
      const fixSpinner = ora('🔧 Fixing TypeScript binary symlinks...').start();
      try {
        await fixTypeScriptBinaries(targetDir, options.verbose);
        fixSpinner.succeed('✅ TypeScript binaries fixed');
      } catch (error) {
        fixSpinner.fail('⚠️  Failed to fix TypeScript binaries - you may need to reinstall TypeScript');
        if (options.verbose) {
          console.log(chalk.red(`TypeScript fix error: ${error.message}`));
        }
      }
    } catch (error) {
      installSpinner.fail('⚠️  Failed to install dependencies - you can run npm install manually');
      if (options.verbose) {
        console.log(chalk.red(`Install error: ${error.message}`));
      }
      console.log(chalk.yellow('You can install dependencies later with: npm install'));
    }
  }
  
  // Success message
  console.log('');
  console.log(chalk.green.bold('🎉 Project created successfully!'));
  console.log('');
  console.log(chalk.blue.bold('🚀 Next steps:'));
  console.log(chalk.white(`  cd ${projectName}`));
  if (options.skipInstall) {
    console.log(chalk.white('  npm install'));
  }
  console.log('');
  console.log(chalk.blue.bold('💡 Create your smart contract:'));
  console.log(chalk.white('  touch voting.compact'));
  console.log(chalk.gray('  # Edit with your favorite editor'));
  console.log('');
  console.log(chalk.blue.bold('🔧 Generate CLI:'));
  console.log(chalk.white('  npm run dev'));
  console.log('');
  console.log(chalk.blue.bold('🌐 Deploy to testnet:'));
  console.log(chalk.white('  npm run deploy'));
  console.log(chalk.blue.bold('🌐 Generate a new wallet:'));
  console.log(chalk.white('  npm run wallet'));
  console.log(chalk.blue.bold('🌐 Request a token from faucet:'));
  console.log(chalk.white('  npm run faucet'));
  console.log(chalk.blue.bold('🌐 Get the balance of wallet:'));
  console.log(chalk.white('  npm run balance'));
  console.log('');
  console.log(chalk.blue.bold('📚 Check status:'));
  console.log(chalk.white('  npm run check'));
  console.log('');
  console.log(chalk.cyan('📖 Documentation: https://github.com/kaleababayneh/create-midnight-app'));
  console.log('');
  console.log(chalk.gray('Happy coding with Midnight! 🌙✨'));
}

async function installDependencies(projectDir, verbose = false) {
  return new Promise((resolve, reject) => {
    const npm = spawn('npm', ['install'], {
      cwd: projectDir,
      stdio: verbose ? 'inherit' : 'ignore'
    });
    
    npm.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`npm install failed with exit code ${code}`));
      }
    });
    
    npm.on('error', (error) => {
      reject(new Error(`Failed to start npm install: ${error.message}`));
    });
    
    // Timeout after 5 minutes
    const timeout = setTimeout(() => {
      npm.kill();
      reject(new Error('npm install timed out after 5 minutes'));
    }, 5 * 60 * 1000);
    
    npm.on('close', () => {
      clearTimeout(timeout);
    });
  });
}

async function fixTypeScriptBinaries(projectDir, verbose = false) {
  const binDir = path.join(projectDir, 'node_modules', '.bin');
  const tscBin = path.join(binDir, 'tsc');
  const tsserverBin = path.join(binDir, 'tsserver');
  
  if (verbose) {
    console.log(chalk.gray(`Checking TypeScript binaries in: ${binDir}`));
  }
  
  // Fix tsc binary
  if (await fs.pathExists(tscBin)) {
    const stats = await fs.lstat(tscBin);
    if (!stats.isSymbolicLink()) {
      if (verbose) {
        console.log(chalk.gray('Fixing tsc binary symlink...'));
      }
      await fs.remove(tscBin);
      await fs.ensureSymlink('../typescript/bin/tsc', tscBin);
    }
  }
  
  // Fix tsserver binary
  if (await fs.pathExists(tsserverBin)) {
    const stats = await fs.lstat(tsserverBin);
    if (!stats.isSymbolicLink()) {
      if (verbose) {
        console.log(chalk.gray('Fixing tsserver binary symlink...'));
      }
      await fs.remove(tsserverBin);
      await fs.ensureSymlink('../typescript/bin/tsserver', tsserverBin);
    }
  }
}
