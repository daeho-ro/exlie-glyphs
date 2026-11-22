import ReaderBoot from './reader-boot';
import { body, scripts } from './reader-template.mjs';

export const dynamic = 'force-static';

export default function ReaderPage() {
  return (
    <>
      <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: body }} />
      <ReaderBoot sources={scripts} />
    </>
  );
}
