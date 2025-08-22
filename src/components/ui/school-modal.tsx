import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import { X, Save, MapPin, Phone, Mail, Users } from 'lucide-react-native';
import { Text } from './text';
import { Input } from './input';
import { Button } from './button';
import { Card } from './card';
import { useColorScheme } from '~/src/hooks/ui/useColorScheme';
import type { School } from './school-card';

interface SchoolModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (school: Partial<School>) => void;
  school?: School | null;
  mode: 'add' | 'edit';
}

export function SchoolModal({
  visible,
  onClose,
  onSave,
  school,
  mode,
}: SchoolModalProps) {
  const { isDarkColorScheme } = useColorScheme();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    address: '',
    phone: '',
    email: '',
    studentCount: '',
    grades: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (school && mode === 'edit') {
      setFormData({
        name: school.name || '',
        location: school.location || '',
        address: school.address || '',
        phone: school.phone || '',
        email: school.email || '',
        studentCount: school.studentCount?.toString() || '',
        grades: school.grades?.join(', ') || '',
      });
    } else {
      // Reset form for add mode
      setFormData({
        name: '',
        location: '',
        address: '',
        phone: '',
        email: '',
        studentCount: '',
        grades: '',
      });
    }
    setErrors({});
  }, [school, mode, visible]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'La ubicación es requerida';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido';
    }

    if (formData.studentCount && isNaN(Number(formData.studentCount))) {
      newErrors.studentCount = 'Debe ser un número válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const schoolData: Partial<School> = {
      name: formData.name.trim(),
      location: formData.location.trim(),
      address: formData.address.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      email: formData.email.trim() || undefined,
      studentCount: formData.studentCount ? Number(formData.studentCount) : 0,
      grades: formData.grades ? formData.grades.split(',').map(g => g.trim()).filter(Boolean) : [],
      status: 'active',
    };

    if (mode === 'edit' && school) {
      schoolData.id = school.id;
    }

    onSave(schoolData);
    onClose();
  };

  const handleClose = () => {
    // Check if form has changes
    const hasChanges = mode === 'add' 
      ? Object.values(formData).some(value => value.trim() !== '')
      : school && (
          formData.name !== school.name ||
          formData.location !== school.location ||
          formData.address !== (school.address || '') ||
          formData.phone !== (school.phone || '') ||
          formData.email !== (school.email || '') ||
          formData.studentCount !== school.studentCount.toString() ||
          formData.grades !== (school.grades?.join(', ') || '')
        );

    if (hasChanges) {
      Alert.alert(
        'Descartar cambios',
        '¿Estás seguro de que quieres descartar los cambios?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Descartar', style: 'destructive', onPress: onClose },
        ]
      );
    } else {
      onClose();
    }
  };

  const iconColor = isDarkColorScheme ? '#94A3B8' : '#64748B';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-background"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-border bg-background">
          <Pressable onPress={handleClose} className="p-2">
            <X size={24} color={iconColor} />
          </Pressable>
          
          <Text className="text-lg font-semibold text-foreground">
            {mode === 'add' ? 'Nueva Escuela' : 'Editar Escuela'}
          </Text>
          
          <Button onPress={handleSave} size="sm">
            <View className="flex-row items-center">
              <Save size={16} color="white" />
              <Text className="ml-1 text-white font-medium">Guardar</Text>
            </View>
          </Button>
        </View>

        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          {/* Basic Information */}
          <Card className="p-4 mb-4">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Información Básica
            </Text>
            
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Nombre de la Escuela *
                </Text>
                <Input
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  placeholder="Ej. Universidad Nacional"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <Text className="text-red-500 text-sm mt-1">{errors.name}</Text>
                )}
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Ubicación *
                </Text>
                <View className="flex-row items-center">
                  <MapPin size={20} color={iconColor} />
                  <Input
                    className={`flex-1 ml-2 ${errors.location ? 'border-red-500' : ''}`}
                    value={formData.location}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                    placeholder="Ciudad, Estado"
                  />
                </View>
                {errors.location && (
                  <Text className="text-red-500 text-sm mt-1">{errors.location}</Text>
                )}
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Dirección Completa
                </Text>
                <Input
                  value={formData.address}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                  placeholder="Dirección completa (opcional)"
                  multiline
                />
              </View>
            </View>
          </Card>

          {/* Contact Information */}
          <Card className="p-4 mb-4">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Información de Contacto
            </Text>
            
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Teléfono
                </Text>
                <View className="flex-row items-center">
                  <Phone size={20} color={iconColor} />
                  <Input
                    className="flex-1 ml-2"
                    value={formData.phone}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                    placeholder="(55) 1234-5678"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Email
                </Text>
                <View className="flex-row items-center">
                  <Mail size={20} color={iconColor} />
                  <Input
                    className={`flex-1 ml-2 ${errors.email ? 'border-red-500' : ''}`}
                    value={formData.email}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                    placeholder="contacto@escuela.edu"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {errors.email && (
                  <Text className="text-red-500 text-sm mt-1">{errors.email}</Text>
                )}
              </View>
            </View>
          </Card>

          {/* Academic Information */}
          <Card className="p-4 mb-6">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Información Académica
            </Text>
            
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Número de Estudiantes
                </Text>
                <View className="flex-row items-center">
                  <Users size={20} color={iconColor} />
                  <Input
                    className={`flex-1 ml-2 ${errors.studentCount ? 'border-red-500' : ''}`}
                    value={formData.studentCount}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, studentCount: text }))}
                    placeholder="500"
                    keyboardType="numeric"
                  />
                </View>
                {errors.studentCount && (
                  <Text className="text-red-500 text-sm mt-1">{errors.studentCount}</Text>
                )}
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Grados/Niveles
                </Text>
                <Input
                  value={formData.grades}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, grades: text }))}
                  placeholder="Ej. Primaria, Secundaria, Preparatoria"
                  multiline
                />
                <Text className="text-xs text-muted-foreground mt-1">
                  Separa los grados con comas
                </Text>
              </View>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}