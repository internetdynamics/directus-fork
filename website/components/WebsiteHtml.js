
import React from 'react';
import DOMPurify from 'dompurify';

export default class WebsiteHtml extends React.Component {
  render() {
    const { html } = this.props || "";
    // html = DOMPurify.sanitize(html);

    return (
      <div dangerouslySetInnerHTML={{__html: html}} />
    );
  }
}
