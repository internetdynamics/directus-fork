import React from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
// let dompurify = new DOMPurify();

export default class WebsiteMarkdown extends React.Component {
  constructor(props) {
    super(props);

    marked.setOptions({
      gfm: true,
      tables: true,
      breaks: false,
      pedantic: false,
      sanitize: false, // deprecated. Use DOMPurify instead.
      smartLists: true,
      smartypants: false
    });
  }
  render() {
    const { text } = this.props;
    // const html = DOMPurify.sanitize(marked.parse(text || ''));
    const html = marked.parse(text || "");

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  }
}

// WebsiteMarkdown.propTypes = {
//   text: React.PropTypes.string.isRequired
// };

// WebsiteMarkdown.defaultProps = {
//   text: ''
// };
