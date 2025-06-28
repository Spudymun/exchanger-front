#!/usr/bin/env node

/**
 * Cleanup script for unused imports and code
 * Run with: node scripts/cleanup-unused.js
 */

const fs = require('fs')
const path = require('path')

console.log('🧹 Starting cleanup of unused code...')

// Check if api-client is actually used anywhere
const packagesToCheck = [
    '@repo/api-client',
    './lib/stores',
    '../lib/stores'
]

function findInFiles(dir, extensions, searchTerms) {
    const results = []

    function search(currentDir) {
        const files = fs.readdirSync(currentDir)

        for (const file of files) {
            const filePath = path.join(currentDir, file)
            const stat = fs.statSync(filePath)

            if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
                search(filePath)
            } else if (stat.isFile() && extensions.some(ext => file.endsWith(ext))) {
                const content = fs.readFileSync(filePath, 'utf8')

                for (const term of searchTerms) {
                    if (content.includes(term) && !filePath.includes('node_modules')) {
                        results.push({ file: filePath, term, line: content.split('\n').findIndex(line => line.includes(term)) + 1 })
                    }
                }
            }
        }
    }

    search(dir)
    return results
}

// Check for unused api-client imports
console.log('📦 Checking for @repo/api-client usage...')
const apiClientUsage = findInFiles('./apps', ['.ts', '.tsx'], ['@repo/api-client'])
const storesUsage = findInFiles('./apps', ['.ts', '.tsx'], ['../lib/stores', './lib/stores'])

if (apiClientUsage.length === 0) {
    console.log('✅ @repo/api-client is not used anywhere - safe to deprecate')
} else {
    console.log('⚠️  @repo/api-client is still used in:')
    apiClientUsage.forEach(usage => console.log(`   ${usage.file}:${usage.line}`))
}

if (storesUsage.length === 0) {
    console.log('✅ Local stores imports not found - migration complete')
} else {
    console.log('⚠️  Local stores still used in:')
    storesUsage.forEach(usage => console.log(`   ${usage.file}:${usage.line}`))
}

// Check for unused dependencies in package.json files
console.log('\n📋 Checking package dependencies...')

function checkPackageJson(pkgPath) {
    if (!fs.existsSync(pkgPath)) return

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }

    console.log(`\n📦 ${pkgPath}:`)
    Object.keys(deps).forEach(dep => {
        if (dep.startsWith('@repo/')) {
            console.log(`   ${dep}: ${deps[dep]}`)
        }
    })
}

// Check main package.json files
checkPackageJson('./package.json')
checkPackageJson('./apps/web/package.json')
checkPackageJson('./apps/admin-panel/package.json')
checkPackageJson('./apps/docs/package.json')

console.log('\n✨ Cleanup check complete!')
console.log('\n💡 Next steps:')
console.log('   1. Remove unused dependencies if any')
console.log('   2. Run `npm run lint` to check for issues')
console.log('   3. Run `npm run test` to ensure nothing broke')
