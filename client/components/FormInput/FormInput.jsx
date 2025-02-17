import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import css from './FormInput.css';
import cuid from 'cuid';

export default class FormInput extends PureComponent {
  static displayName = 'FormInput';

  static propTypes = {
    className: PropTypes.string,
    label: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    id: PropTypes.string
  };

  static defaultProps = {
    className: null,
    id: cuid()
  };

  render() {
    const { className, name, label, id, ...rest } = this.props;
    return (
      <div className={classnames(css.formInput, className)}>
        <label htmlFor={id}>{label}</label>
        <input id={id} name={name} {...rest} />
      </div>
    );
  }
}
