// @flow weak

import React, {
  PureComponent
}                       from 'react';
import PropTypes        from 'prop-types';
import { AnimatedView } from '../../components';
import './demo.css'
import App from './app';

class SimpleTables extends PureComponent {
  componentWillMount() {
    const { actions: {  enterSimpleTables } } = this.props;
    enterSimpleTables();
  }

  componentWillUnmount() {
    const { actions: {  leaveSimpleTables } } = this.props;
    leaveSimpleTables();
  }

  render() {
    return(
      <AnimatedView>
        <div className='col-md-offset-1 col-md-8'>
          <div className='panel panel-default'>
            <div className='panel-heading'>A Complex Example</div>
            <h5>Source in /examples/js/complex/app.js</h5>
            <div className='panel-body'>
              <App />
            </div>
          </div>
        </div>
      </AnimatedView>
    );
  }
}

SimpleTables.propTypes= {
  actions: PropTypes.shape({
    enterSimpleTables: PropTypes.func,
    leaveSimpleTables: PropTypes.func
  })
};

export default SimpleTables;
