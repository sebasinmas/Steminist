import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { InformationCircleIcon } from '../common/Icons';

interface HelpCenterCardProps {
    onContactClick: () => void;
}

const HelpCenterCard: React.FC<HelpCenterCardProps> = ({ onContactClick }) => {
    return (
        <Card>
            <h3 className="text-lg font-bold mb-2">Centro de Ayuda</h3>
            <p className="text-sm text-muted-foreground mb-4">
                ¿Tienes alguna pregunta o problema? Contacta a nuestro equipo de soporte.
            </p>
            <Button variant="secondary" className="w-full flex items-center justify-center" onClick={onContactClick}>
                <InformationCircleIcon className="w-5 h-5 mr-2" />
                Contactar a Soporte
            </Button>
        </Card>
    );
};

export default HelpCenterCard;