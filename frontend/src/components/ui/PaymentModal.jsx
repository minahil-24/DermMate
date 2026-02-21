import Modal from '../ui/Modal'

const PaymentModal = ({ isOpen, onClose, onPay }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choose Payment Method">
      <div className="space-y-4">
        <button
          onClick={() => onPay('JazzCash')}
          className="w-full p-3 border rounded"
        >
          JazzCash
        </button>

        <button
          onClick={() => onPay('EasyPaisa')}
          className="w-full p-3 border rounded"
        >
          EasyPaisa
        </button>

        <button
          onClick={() => onPay('Clinic')}
          className="w-full p-3 border rounded"
        >
          Pay at Clinic
        </button>
      </div>
    </Modal>
  )
}

export default PaymentModal
