import { Construct } from 'constructs';
import { App, Duration, Stack, StackProps } from 'aws-cdk-lib';

import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';

import { Code, Function, Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';

import { StringParameter } from 'aws-cdk-lib/aws-ssm';

import { Table } from 'aws-cdk-lib/aws-dynamodb';

import { Queue } from 'aws-cdk-lib/aws-sqs';

import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

class BackgroundJobStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const app = this.node.tryGetContext('app');
    const version = this.node.tryGetContext('version');

    const name = `${app}_public-api-background-job_${version}`;
    const configRootKey = `/${app}/${version}`;

    const queue = Queue.fromQueueArn(
      this,
      'Queue',
      `arn:aws:sqs:${this.region}:${this.account}:${app}_passes_load_${version}.fifo`
    );

    const lambda = new Function(this, 'Lambda', {
      functionName: name,
      handler: 'index.handler',
      runtime: Runtime.NODEJS_18_X,
      memorySize: 3008,
      timeout: Duration.minutes(5),
      tracing: Tracing.ACTIVE,
      code: Code.fromAsset(`./dist`),
      environment: {
        NODE_ENV: 'production',
        CONFIG_ROOT_KEY: configRootKey
      }
    });

    lambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['ssm:GetParametersByPath'],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter${configRootKey}`
        ]
      })
    );

    for (const partialName of ['applicants', 'passes']) {
      const tableName = StringParameter.valueForStringParameter(
        this,
        `${configRootKey}/${partialName}Table`
      );

      const table = Table.fromTableArn(
        this,
        `${partialName}DynamoDBTable`,
        `arn:aws:dynamodb:${this.region}:${this.account}:table/${tableName}`
      );

      table.grantReadWriteData(lambda);
    }

    lambda.addEventSource(new SqsEventSource(queue));

    queue.grantConsumeMessages(lambda);
  }
}

const app = new App();

new BackgroundJobStack(app, 'PublicApiBackgroundJobStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  },
  stackName: `${app.node.tryGetContext(
    'app'
  )}-public-api-background-job-${app.node.tryGetContext('version')}`
});

app.synth();
