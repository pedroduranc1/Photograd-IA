import React from 'react';
import { View, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '../../../src/components/ui/text';
import { Button } from '../../../src/components/ui/button';
import { SchoolDetail } from '../../../src/components/ui/school-detail';
import { type School } from '../../../src/components/ui/school-card';

// Mock data - replace with actual data source
const mockSchools: School[] = [
  {
    id: '1',
    name: 'Universidad Nacional',
    location: 'Ciudad de México, CDMX',
    address: 'Av. Universidad 3000, Coyoacán, CDMX',
    studentCount: 1200,
    nextGraduation: '15 de Julio, 2025',
    status: 'active',
    phone: '(55) 5622-0000',
    email: 'contacto@unam.mx',
    debtAmount: 0,
    grades: ['Licenciatura', 'Maestría', 'Doctorado'],
  },
  {
    id: '2',
    name: 'Instituto Tecnológico',
    location: 'Guadalajara, Jalisco',
    address: 'Av. Tecnológico 1500, Guadalajara, JAL',
    studentCount: 800,
    nextGraduation: '22 de Julio, 2025',
    status: 'active',
    phone: '(33) 3669-3000',
    email: 'info@itgdl.edu.mx',
    debtAmount: 15000,
    grades: ['Ingeniería', 'Tecnología', 'Innovación'],
  },
  {
    id: '3',
    name: 'Colegio San Patricio',
    location: 'Monterrey, Nuevo León',
    address: 'Calle Educación 456, San Pedro, NL',
    studentCount: 450,
    nextGraduation: '29 de Julio, 2025',
    status: 'active',
    phone: '(81) 8358-2000',
    email: 'admisiones@sanpatricio.edu.mx',
    debtAmount: 0,
    grades: ['Primaria', 'Secundaria', 'Preparatoria'],
  },
  {
    id: '4',
    name: 'Universidad del Valle',
    location: 'Puebla, Puebla',
    address: 'Blvd. Forjadores 1234, Puebla, PUE',
    studentCount: 650,
    nextGraduation: '12 de Agosto, 2025',
    status: 'inactive',
    phone: '(222) 229-5500',
    email: 'contacto@udv.edu.mx',
    debtAmount: 25000,
    grades: ['Licenciatura', 'Posgrado'],
  },
];

export default function SchoolDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Find the school by ID
  const school = mockSchools.find((s) => s.id === id);

  if (!school) {
    return (
      <View className="flex-1 bg-background pt-2 justify-center items-center px-6">
        <Text className="text-xl font-semibold text-foreground mb-4 text-center">
          Escuela no encontrada
        </Text>
        <Text className="text-muted-foreground text-center mb-6">
          La escuela que buscas no existe o ha sido eliminada.
        </Text>
        <Button onPress={() => router.back()} variant="outline">
          <Text>Volver</Text>
        </Button>
      </View>
    );
  }

  const handleEdit = () => {
    // Navigate back to list with edit mode
    // You could also implement a separate edit screen here
    router.back();
    // TODO: Trigger edit modal on parent screen
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Escuela',
      `¿Estás seguro de que quieres eliminar "${school.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement delete logic
            Alert.alert('Éxito', 'Escuela eliminada correctamente');
            router.back();
          },
        },
      ]
    );
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View className="flex-1 bg-background ">
      <SchoolDetail
        school={school}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBack={handleBack}
      />
    </View>
  );
}