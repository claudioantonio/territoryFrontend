import React, { Component } from 'react';
import { usePromiseTracker } from "react-promise-tracker";

//TODO Preciso declarar props se não uso?

/**
 * Loading spinner to rest calls and other non immediate actions
 * 
 * @param props not used
 */
const LoadingSpinner: React.FC = (props) => {
const { promiseInProgress } = usePromiseTracker();

  return (
    <div>
    {
      (promiseInProgress === true) ? <h3>Please wait...</h3>:null
    }
    </div>
  )
};

export default LoadingSpinner;