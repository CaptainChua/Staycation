"use client";

import HavenFormModal from "./HavenFormModal";

interface AddNewHavenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddNewHavenModal = ({ isOpen, onClose }: AddNewHavenModalProps) => {
  return (
    <HavenFormModal 
      isOpen={isOpen} 
      onClose={onClose} 
      initialData={null}
    />
  );
};

export default AddNewHavenModal;