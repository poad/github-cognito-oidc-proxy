import * as childProcess from 'child_process';
import * as fs from 'fs';

interface NextJsExportProps { endpoint: string };

export const nextJsExport = ({ endpoint }: NextJsExportProps) => {
  [`${process.cwd()}/../app/.next`, `${process.cwd()}/../app/out`].forEach(
    (dir) => {
      if (fs.existsSync(dir)) {
        fs.rmdirSync(dir, {
          recursive: true,
        });
      }
    },
  );
  ['pnpm install'].forEach((cmd) => {
    childProcess.execSync(cmd, {
      cwd: `${process.cwd()}/../app`,
      stdio: ['ignore', 'inherit', 'inherit'],
      env: { ...process.env },
      shell: 'bash',
    });
  });

  ['pnpm release'].forEach((cmd) => {
    childProcess.execSync(cmd, {
      cwd: `${process.cwd()}/../app`,
      stdio: ['ignore', 'inherit', 'inherit'],
      env: {
        ...process.env,
        NEXT_PUBLIC_COGNITO_ENDPOINT: endpoint,
      },
      shell: 'bash',
    });
  });
};
