#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';

const app = new cdk.App();
const appName = app.node.tryGetContext('appName') ?? '';
const clientId = app.node.tryGetContext('clientId') ?? '';
const clientSecret = app.node.tryGetContext('clientSecret') ?? '';
const logLevel = app.node.tryGetContext('logLevel') ?? 'info';

new CdkStack(app, 'CdkStack', {
  appName,
  clientId,
  clientSecret,
  logLevel,
});
