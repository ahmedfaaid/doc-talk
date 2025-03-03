import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { components } from './markdown-components';

interface MardownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MardownRendererProps) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      rehypePlugins={[rehypeRaw]}
      components={components}
      className='prose dark:prose-invert prose-gray max-w-none'
    >
      {content}
    </Markdown>
  );
}
