import { App } from 'aws-cdk-lib';
import * as environments from './pipeline/environments';
import { Pipeline } from './pipeline/pipeline';

const app = new App();

new Pipeline(app, 'network', {
  env: environments.deploy,
  repo: 'xxxxx/yyyyyy',
  branch: 'main',
  codestarArn: 'arn:aws:codestar-connections:ap-southeast-2:9xxxxx7:connection/6xxxxx-xxxxx-xxxx3',
});

app.synth();