/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import VideoTranslator from './components/VideoTranslator';
import { Toaster } from '@/components/ui/sonner';

export default function App() {
  return (
    <>
      <VideoTranslator />
      <Toaster position="top-center" theme="dark" />
    </>
  );
}
