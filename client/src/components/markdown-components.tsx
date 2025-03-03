import { createElement } from 'react';
import { Components } from 'react-markdown';

const createHeadingComponent = (level: number): Components['h1'] => {
  const HeadingComp: Components['h1'] = ({ children, ...props }) => {
    const HTag = `h${level}` as keyof JSX.IntrinsicElements;
    const classnames = `text-${6 - level}xl font-bold mt-4 mb-2`;
    return createElement(HTag, { className: classnames, ...props }, children);
  };

  return Object.assign(HeadingComp, { displayName: `Heading${level}` });
};

const ParagraphComponent: Components['p'] = ({ children, ...props }) => {
  return (
    <p className='mb-2' {...props}>
      {children}
    </p>
  );
};

const UnorderedListComponent: Components['ul'] = ({ children, ...props }) => {
  return (
    <ul className='mb-2 list-disc pl-5' {...props}>
      {children}
    </ul>
  );
};

const OrderedListComponent: Components['ol'] = ({ children, ...props }) => {
  return (
    <ol className='mb-2 list-decimal pl-5' {...props}>
      {children}
    </ol>
  );
};

const ListItemComponent: Components['li'] = ({ children, ...props }) => {
  return (
    <li className='mb-2' {...props}>
      {children}
    </li>
  );
};

const HorizontalRuleComponent: Components['hr'] = ({ children, ...props }) => {
  return <hr className='my-4' {...props} />;
};

const LinkComponent: Components['a'] = ({ children, ...props }) => {
  return (
    <a className='text-sky-700 hover:underline' {...props}>
      {children}
    </a>
  );
};

const TableHeaderComponent: Components['td'] = ({ children, ...props }) => {
  return (
    <th className='p-2 text-center align-middle text-sm font-bold' {...props}>
      {children}
    </th>
  );
};

const TableCellComponent: Components['td'] = ({ children, ...props }) => {
  return (
    <td className='p-2 text-center align-middle' {...props}>
      {children}
    </td>
  );
};

const StrongComponent: Components['strong'] = ({ children, ...props }) => {
  return (
    <strong className='font-bold' {...props}>
      {children}
    </strong>
  );
};

const EmComponent: Components['em'] = ({ children, ...props }) => {
  return (
    <em className='italic' {...props}>
      {children}
    </em>
  );
};

export const components: Partial<Components> = {
  h1: createHeadingComponent(1),
  h2: createHeadingComponent(2),
  h3: createHeadingComponent(3),
  h4: createHeadingComponent(4),
  h5: createHeadingComponent(5),
  h6: createHeadingComponent(6),
  p: Object.assign(ParagraphComponent, { displayName: 'ParagraphComponent' }),
  ul: Object.assign(UnorderedListComponent, {
    displayName: 'UnorderedListComponent'
  }),
  ol: Object.assign(OrderedListComponent, {
    displayName: 'OrderedListComponent'
  }),
  li: Object.assign(ListItemComponent, { displayName: 'ListItemComponent' }),
  hr: Object.assign(HorizontalRuleComponent, {
    displayName: 'HorizontalRuleComponent'
  }),
  a: Object.assign(LinkComponent, { displayName: 'LinkComponent' }),
  th: Object.assign(TableHeaderComponent, {
    displayName: 'TableHeaderComponent'
  }),
  td: Object.assign(TableCellComponent, { displayName: 'TableCellComponent' }),
  strong: Object.assign(StrongComponent, { displayName: 'StrongComponent' }),
  em: Object.assign(EmComponent, { displayName: 'EmComponent' })
};
