import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearErrorMessage, RootState } from '../reduxStoreAndSlices/store';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const MyComponent = () => {
  const errorMessage = useSelector((state: RootState) => state.wbsData.errorMessage);
  const dispatch = useDispatch();

  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (errorMessage) setOpen(true);
  }, [errorMessage]);

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
    dispatch(clearErrorMessage());
  };

  return (
    <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
      <Alert onClose={handleClose} severity="error" sx={{ width: '100%' }}>
        {errorMessage}
      </Alert>
    </Snackbar>
  );
};

export default MyComponent;