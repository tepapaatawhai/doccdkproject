# doccdkproject
A projen template for creating a CDK project with pipelines in opionated way.


### Prerequistes

- Create a new github repo, and intialise it.
- Create a new project in Code Catalyst, and connect it to the Github Repo
- Create an environment in Code Catalyst and connect it. 


### Create the application with projen

`npx projen new awscdk-app-ts`


### Edit .projenrc.ts

- Set cdk version to current version
- add context

```
context: {
    '@aws-cdk/customresources:installLatestAwsSdkDefault': false,
  },
```

- add dependenices if needed
```
deps: [
    'raindancers-cdk',
  ], /* Runtime dependencies of this module. */
```

- add gitIgnores if needed
```
project.addGitIgnore('!projectAssets/**');
project.addGitIgnore('!docs/**');
```

Run projen again `npx projen`


### Tests

For a simple project, without tests, remove the file main.test.ts from /test


## Create new files. 

#### `/src/environments.ts`
  This provides an easy way to get the details of various environments that you may use in your project.   

```
import * as core from 'aws-cdk-lib';

export const dev: core.Environment = {
  account: '11111111111',
  region: 'ap-southeast-2',
};

export const deploy: core.Environment = {
  account: '222222222222',
  region: 'ap-southeast-2',
};
```

#### `/src/pipeline.ts`
 The pipeline defines how the application will be deployed. This will vary across deployment, this is a starting point.


 ```typescript
import * as cdk from 'aws-cdk-lib';
import {
  pipelines,
}
  from 'aws-cdk-lib';
import * as constructs from 'constructs';
import * as environments from './environments';

import { ExampleStack } from '../examplestack';

export interface PipelineProps extends cdk.StackProps{
  repo: string;
  branch: string;
  codestarArn: string;
}

export class Pipeline extends cdk.Stack {

  constructor(scope: constructs.Construct, id: string, props: PipelineProps) {
    super(scope, id, props);

    const pipeline = new pipelines.CodePipeline(this, 'Pipeline', {
      crossAccountKeys: true,
      selfMutation: true,
      dockerEnabledForSelfMutation: true,
      dockerEnabledForSynth: true, // we need this to bundle the lambdas with requirements

      synth: new pipelines.ShellStep('Synth', {

        // Use a connection created using the AWS console to authenticate to GitHub
        // Other sources are available.
        input: pipelines.CodePipelineSource.connection(
          props.repo,
          props.branch,
          { connectionArn: props.codestarArn },
        ),
        commands: [
          'yarn install',
          'yarn build',
          'npx cdk synth',
        ],
      }),
    });

    pipeline.addStage(
      new ExampleStage(this, 'dev', {
        env: environment.dev,
      }),
      {
        pre: [
          new pipelines.ManualApprovalStep('DeploytoManagmentAccount'),
        ],
      },
    );
  }
}

class ExampleStage extends cdk.Stage {
  constructor(scope: constructs.Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    new ExampleStage(this, 'ExampleStage', {
      env: environments.network,
    });

  }
}
```

## Modify main.ts

You need to provide the repo details, here for your project

```
import { App } from 'aws-cdk-lib';
import * as environments from './pipeline/environments'
import { Pipeline } from './pipeline/pipeline';

const app = new App();

new Pipeline(app, 'network', {
  env: environments.deploy,
  repo: 'xxxxx/yyyyyy',
  branch: 'main',
  codestarArn: 'arn:aws:codestar-connections:ap-southeast-2:9xxxxx7:connection/6xxxxx-xxxxx-xxxx3',
});

app.synth();
```


### Build
`npx projen build`


### Deploy
`npx cdk deploy --profile deploy`


