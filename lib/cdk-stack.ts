import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as awslogs from 'aws-cdk-lib/aws-logs';
import assert from 'assert';

interface CdkStackProps extends cdk.StackProps {
  appName: string;
  clientId: string;
  clientSecret: string;
  logLevel: string;
}

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: CdkStackProps) {
    super(scope, id, props);

    assert(props);
    assert(props?.appName);
    assert(props?.clientId);
    assert(props?.clientSecret);

    const appName = props?.appName ?? '';

    new awslogs.LogGroup(this, 'LogGroup', {
      logGroupName: `/aws/lambda/${appName}`,
      retention: awslogs.RetentionDays.ONE_DAY,
    });

    const fn = new nodejs.NodejsFunction(this, 'LambdaFunction', {
      functionName: appName,
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      entry: './lambda/index.ts',
      timeout: cdk.Duration.minutes(15),
      retryAttempts: 0,
      environment: {
        LOG_LEVEL: props?.logLevel ?? 'info',
        POWERTOOLS_LOG_LEVEL: props?.logLevel ?? 'info',
        GITHUB_ID: props?.clientId ?? '',
        GITHUB_SECRET: props?.clientSecret ?? '',
        NODE_OPTIONS: '--enable-source-maps',
      },
      bundling: {
        minify: false,
        sourceMap: true,
        sourceMapMode: nodejs.SourceMapMode.BOTH,
        sourcesContent: true,
        keepNames: true,
      },
    });
    fn.addFunctionUrl({
      authType: cdk.aws_lambda.FunctionUrlAuthType.NONE,
    });
  }
}
