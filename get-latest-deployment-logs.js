#!/usr/bin/env node

import { get } from 'https';

const TOKEN = "1em11PWm0IHIJraAxIpqUhpa";
const PROJECT_ID = "prj_N7f3PwO83J1gruOj9L58IeM37j4G";
const TEAM_ID = "team_4w01IFAJE4JiSCILXIWOobYd";

function httpsGet(url, headers) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        ...headers
      }
    };

    get(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function getLatestDeployment() {
  console.log('🔍 Fetching latest deployment...\n');

  const url = `https://api.vercel.com/v6/deployments?projectId=${PROJECT_ID}&teamId=${TEAM_ID}&limit=1`;
  const response = await httpsGet(url);

  if (!response.deployments || response.deployments.length === 0) {
    throw new Error('No deployments found');
  }

  const deployment = response.deployments[0];
  console.log(`📦 Deployment ID: ${deployment.uid}`);
  console.log(`🌿 Branch: ${deployment.meta?.githubCommitRef || 'unknown'}`);
  console.log(`📝 Commit: ${deployment.meta?.githubCommitSha?.substring(0, 7) || 'unknown'}`);
  console.log(`⏰ Created: ${new Date(deployment.created).toLocaleString()}`);
  console.log(`📊 State: ${deployment.state || deployment.readyState}`);
  console.log(`🔗 URL: ${deployment.url}\n`);

  return deployment;
}

async function getDeploymentLogs(deploymentId) {
  console.log('📜 Fetching build logs...\n');
  console.log('='.repeat(80));

  const url = `https://api.vercel.com/v2/deployments/${deploymentId}/events?teamId=${TEAM_ID}`;
  const response = await httpsGet(url);

  if (!Array.isArray(response)) {
    console.error('Unexpected response format:', response);
    return;
  }

  // Filter and display logs
  const buildLogs = response
    .filter(event => event.type === 'stdout' || event.type === 'stderr' || event.text)
    .sort((a, b) => a.created - b.created);

  if (buildLogs.length === 0) {
    console.log('⚠️  No build logs available yet. The build might still be in progress.');
    return;
  }

  buildLogs.forEach(log => {
    const timestamp = new Date(log.created).toISOString();
    const text = log.payload?.text || log.text || '';

    if (text.trim()) {
      // Color code errors in red
      if (text.includes('Error:') || text.includes('Failed') || text.includes('error')) {
        console.log(`\x1b[31m${text}\x1b[0m`);
      } else if (text.includes('warning') || text.includes('Warning')) {
        console.log(`\x1b[33m${text}\x1b[0m`);
      } else if (text.includes('✓') || text.includes('success')) {
        console.log(`\x1b[32m${text}\x1b[0m`);
      } else {
        console.log(text);
      }
    }
  });

  console.log('='.repeat(80));
}

async function main() {
  try {
    const deployment = await getLatestDeployment();
    await getDeploymentLogs(deployment.uid);

    // Summary
    console.log('\n📊 DEPLOYMENT SUMMARY');
    console.log('='.repeat(80));
    console.log(`Status: ${deployment.state || deployment.readyState}`);

    if (deployment.state === 'ERROR' || deployment.readyState === 'ERROR') {
      console.log('\n❌ Build failed! Check the logs above for errors.');
      process.exit(1);
    } else if (deployment.state === 'READY' || deployment.readyState === 'READY') {
      console.log('\n✅ Build succeeded!');
      console.log(`🚀 Deployment URL: https://${deployment.url}`);
      process.exit(0);
    } else {
      console.log('\n⏳ Build still in progress...');
      console.log('   Run this script again in a minute to see updated logs.');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
