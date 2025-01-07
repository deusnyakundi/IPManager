import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material';

const ConfirmDialog = ({ 
  open, 
  onClose, 
  onConfirm, 
  title, 
  content,
  confirmButtonText = 'Delete',
  cancelButtonText = 'Cancel',
  confirmButtonColor = 'error'
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{content}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} size="small">{cancelButtonText}</Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          color={confirmButtonColor}
          size="small"
        >
          {confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog; 