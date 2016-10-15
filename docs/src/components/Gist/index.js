// modified from: https://gist.github.com/aVolpe/b364a8fcd10f1ba833d97e9ab278f42c
import React, { Component } from 'react';

class Gist extends Component {
  static propTypes = {
    id: React.PropTypes.string.isRequired,
  }

  constructor(props) {
    super(props);

    this.id = props.id;
    this.stylesheetAdded = false;

    this.state = {
      loading: true,
      src: '',
    };

    this.addStylesheet = this.addStylesheet.bind(this);
  }

  componentDidMount() {
    const gistCallback = Gist.nextGistCallback();

    window[gistCallback] = (gist) => {
      this.setState({
        loading: false,
        src: gist.div,
      });

      this.addStylesheet(gist.stylesheet);
    };

    const url = `https://gist.github.com/${this.props.id}.json?callback=${gistCallback}`;
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;

    document.head.appendChild(script);
  }

  addStylesheet(href) {
    if (!this.stylesheetAdded) {
      const link = document.createElement('link');

      this.stylesheetAdded = true;
      link.type = 'text/css';
      link.rel = 'stylesheet';
      link.href = href;

      document.head.appendChild(link);
    }
  }

  render() {
    if (this.state.loading) {
      return <div>...</div>;
    }

    return <div dangerouslySetInnerHTML={{ __html: this.state.src }} />;
  }
}

let gistCallbackId = 0;
Gist.nextGistCallback = () => `embed_gist_callback_${gistCallbackId++}`;

export default Gist;
