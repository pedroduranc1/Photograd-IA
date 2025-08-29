import React from 'react';
import { View, Image, ScrollView, Linking, Alert } from 'react-native';
import { 
  User, Mail, Phone, MapPin, Calendar, Users, Camera, CreditCard, 
  Plus, Eye, Edit, Trash2, AlertCircle, School, GraduationCap 
} from 'lucide-react-native';
import { Card } from './card';
import { Text } from './text';
import { Button } from './button';
import { ExpandableSection } from './expandable-section';
import { QuickActions } from './quick-actions';
import { useColorScheme } from '~/src/hooks/ui/useColorScheme';

interface StudentWithDetails {
  id: string;
  schoolId: string;
  gradeId: string;
  firstName: string;
  lastName: string;
  studentId: string;
  email?: string;
  phone?: string;
  address?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  status: 'active' | 'inactive' | 'graduated';
  enrollmentDate: string;
  graduationDate?: string;
  notes?: string;
  fullName: string;
  age?: number;
  photoCount: number;
  paymentCount: number;
  totalDebt: number;
  school: {
    id: string;
    name: string;
    address: string;
    phone?: string;
    email?: string;
  };
  grade: {
    id: string;
    name: string;
    level: string;
    academicYear?: string;
  };
  recentPhotos?: Array<{
    id: string;
    studentId: string;
    photoUrl: string;
    photoType: 'profile' | 'graduation' | 'event' | 'id_card' | 'other';
    takenDate: string;
  }>;
  recentPayments?: Array<{
    id: string;
    studentId: string;
    amount: number;
    paymentType: 'tuition' | 'registration' | 'materials' | 'events' | 'other';
    paymentMethod: 'cash' | 'card' | 'transfer' | 'check';
    paymentDate: string;
    status: 'pending' | 'paid' | 'overdue' | 'cancelled';
    description?: string;
  }>;
}

interface StudentDetailProps {
  student: StudentWithDetails;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddPhoto?: () => void;
  onAddPayment?: () => void;
  onViewAllPhotos?: () => void;
  onViewAllPayments?: () => void;
  onCall?: (phone: string) => void;
  onEmail?: (email: string) => void;
}

export function StudentDetail({
  student,
  onEdit,
  onDelete,
  onAddPhoto,
  onAddPayment,
  onViewAllPhotos,
  onViewAllPayments,
  onCall,
  onEmail,
}: StudentDetailProps) {
  const { isDarkColorScheme } = useColorScheme();
  const iconColor = isDarkColorScheme ? '#94A3B8' : '#64748B';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'inactive':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
      case 'graduated':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      case 'graduated': return 'Graduado';
      default: return status;
    }
  };

  const getPaymentTypeText = (type: string) => {
    switch (type) {
      case 'tuition': return 'Colegiatura';
      case 'registration': return 'Inscripción';
      case 'materials': return 'Materiales';
      case 'events': return 'Eventos';
      case 'other': return 'Otro';
      default: return type;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 dark:text-green-400';
      case 'pending': return 'text-yellow-600 dark:text-yellow-400';
      case 'overdue': return 'text-red-600 dark:text-red-400';
      case 'cancelled': return 'text-gray-600 dark:text-gray-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const handleCall = (phone: string) => {
    if (onCall) {
      onCall(phone);
    } else {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleEmail = (email: string) => {
    if (onEmail) {
      onEmail(email);
    } else {
      Linking.openURL(`mailto:${email}`);
    }
  };

  // Quick Actions Configuration
  const quickActions = [
    {
      id: 'call',
      label: 'Llamar',
      icon: <Phone size={16} color={iconColor} />,
      onPress: () => student.phone && handleCall(student.phone),
      disabled: !student.phone,
    },
    {
      id: 'email',
      label: 'Email',
      icon: <Mail size={16} color={iconColor} />,
      onPress: () => student.email && handleEmail(student.email),
      disabled: !student.email,
    },
    {
      id: 'add-photo',
      label: 'Agregar Foto',
      icon: <Camera size={16} color={iconColor} />,
      onPress: onAddPhoto || (() => {}),
      disabled: !onAddPhoto,
    },
    {
      id: 'add-payment',
      label: 'Registrar Pago',
      icon: <CreditCard size={16} color={iconColor} />,
      onPress: onAddPayment || (() => {}),
      disabled: !onAddPayment,
    },
  ];

  return (
    <View className="flex-1 bg-background pt-6">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <Card className="p-6 mb-4">
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground mb-2">
                {student.fullName}
              </Text>
              <View className="flex-row items-center mb-2">
                <User size={16} color={iconColor} />
                <Text className="text-muted-foreground ml-2">
                  ID: {student.studentId}
                </Text>
                {student.age && (
                  <Text className="text-muted-foreground ml-2">
                    • {student.age} años
                  </Text>
                )}
              </View>
              <View 
                className={`px-3 py-1 rounded-full self-start ${getStatusColor(student.status)}`}
              >
                <Text className={`text-sm font-medium ${getStatusColor(student.status).split(' ').pop()}`}>
                  {getStatusText(student.status)}
                </Text>
              </View>
            </View>
            
            <View className="flex-row space-x-2">
              <Button variant="outline" size="sm" onPress={onEdit}>
                <Edit size={16} color={iconColor} />
              </Button>
              <Button variant="outline" size="sm" onPress={onDelete}>
                <Trash2 size={16} color="#DC2626" />
              </Button>
            </View>
          </View>

          {/* Debt Warning */}
          {student.totalDebt > 0 && (
            <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
              <View className="flex-row items-center">
                <AlertCircle size={16} color="#DC2626" />
                <Text className="text-red-800 dark:text-red-200 font-medium ml-2">
                  Deuda pendiente: ${student.totalDebt.toLocaleString()}
                </Text>
              </View>
            </View>
          )}

          {/* School & Grade Info */}
          <View className="border-t border-border pt-4">
            <View className="flex-row items-center mb-2">
              <School size={16} color={iconColor} />
              <Text className="text-muted-foreground ml-2">
                {student.school.name}
              </Text>
            </View>
            <View className="flex-row items-center">
              <GraduationCap size={16} color={iconColor} />
              <Text className="text-muted-foreground ml-2">
                {student.grade.name} - {student.grade.level}
              </Text>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <View className="mb-4">
          <QuickActions 
            actions={quickActions} 
            layout="grid"
          />
        </View>

        {/* Personal Information */}
        <ExpandableSection
          title="Información Personal"
          icon={<User size={20} color={iconColor} />}
          defaultExpanded={true}
          className="mb-4"
        >

          {student.email && (
            <View className="flex-row items-center mb-3">
              <Mail size={16} color={iconColor} />
              <Text 
                className="text-muted-foreground ml-3 flex-1"
                onPress={() => handleEmail(student.email!)}
              >
                {student.email}
              </Text>
            </View>
          )}

          {student.phone && (
            <View className="flex-row items-center mb-3">
              <Phone size={16} color={iconColor} />
              <Text 
                className="text-muted-foreground ml-3"
                onPress={() => handleCall(student.phone!)}
              >
                {student.phone}
              </Text>
            </View>
          )}

          {student.address && (
            <View className="flex-row items-start mb-3">
              <MapPin size={16} color={iconColor} style={{ marginTop: 2 }} />
              <Text className="text-muted-foreground ml-3 flex-1">
                {student.address}
              </Text>
            </View>
          )}

          {student.birthDate && (
            <View className="flex-row items-center mb-3">
              <Calendar size={16} color={iconColor} />
              <Text className="text-muted-foreground ml-3">
                Nacimiento: {new Date(student.birthDate).toLocaleDateString('es-MX')}
              </Text>
            </View>
          )}

          <View className="flex-row items-center mb-3">
            <Calendar size={16} color={iconColor} />
            <Text className="text-muted-foreground ml-3">
              Inscrito: {new Date(student.enrollmentDate).toLocaleDateString('es-MX')}
            </Text>
          </View>

          {student.emergencyContactName && (
            <View className="border-t border-border pt-3 mt-3">
              <Text className="text-sm font-medium text-foreground mb-2">
                Contacto de Emergencia
              </Text>
              <View className="flex-row items-center mb-1">
                <Users size={14} color={iconColor} />
                <Text className="text-muted-foreground ml-2">
                  {student.emergencyContactName}
                </Text>
              </View>
              {student.emergencyContactPhone && (
                <View className="flex-row items-center">
                  <Phone size={14} color={iconColor} />
                  <Text 
                    className="text-muted-foreground ml-2"
                    onPress={() => handleCall(student.emergencyContactPhone!)}
                  >
                    {student.emergencyContactPhone}
                  </Text>
                </View>
              )}
            </View>
          )}

          {student.notes && (
            <View className="border-t border-border pt-3 mt-3">
              <Text className="text-sm font-medium text-foreground mb-2">
                Notas
              </Text>
              <Text className="text-muted-foreground">
                {student.notes}
              </Text>
            </View>
          )}
        </ExpandableSection>

        {/* Photos Section */}
        <ExpandableSection
          title="Fotos"
          icon={<Camera size={20} color={iconColor} />}
          badge={student.photoCount}
          defaultExpanded={false}
          className="mb-4"
        >
          <View className="pt-4">

            {student.recentPhotos && student.recentPhotos.length > 0 ? (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                  {student.recentPhotos.map((photo) => (
                    <View key={photo.id} className="mr-3">
                      <Image
                        source={{ uri: photo.photoUrl }}
                        className="w-20 h-20 rounded-lg bg-muted"
                        resizeMode="cover"
                      />
                      <Text className="text-xs text-muted-foreground mt-1 text-center">
                        {photo.photoType}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
                <Button variant="ghost" size="sm" onPress={onViewAllPhotos}>
                  <Eye size={16} color={iconColor} />
                  <Text className="ml-2">Ver todas las fotos</Text>
                </Button>
              </>
            ) : (
              <Text className="text-muted-foreground text-center py-4">
                No hay fotos registradas
              </Text>
            )}
          </View>
        </ExpandableSection>

        {/* Payments Section */}
        <ExpandableSection
          title="Historial de Pagos"
          icon={<CreditCard size={20} color={iconColor} />}
          badge={student.paymentCount}
          defaultExpanded={student.totalDebt > 0}
          className="mb-4"
        >
          <View className="pt-4">

            {student.recentPayments && student.recentPayments.length > 0 ? (
              <>
                {student.recentPayments.map((payment) => (
                  <View key={payment.id} className="border-b border-border pb-3 mb-3 last:border-b-0 last:pb-0 last:mb-0">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-foreground font-medium">
                        ${payment.amount.toLocaleString()}
                      </Text>
                      <Text className={`text-sm font-medium ${getPaymentStatusColor(payment.status)}`}>
                        {payment.status === 'paid' ? 'Pagado' : payment.status}
                      </Text>
                    </View>
                    <Text className="text-muted-foreground text-sm mb-1">
                      {getPaymentTypeText(payment.paymentType)} • {payment.paymentMethod}
                    </Text>
                    {payment.description && (
                      <Text className="text-muted-foreground text-sm mb-1">
                        {payment.description}
                      </Text>
                    )}
                    <Text className="text-muted-foreground text-xs">
                      {new Date(payment.paymentDate).toLocaleDateString('es-MX')}
                    </Text>
                  </View>
                ))}
                <Button variant="ghost" size="sm" onPress={onViewAllPayments}>
                  <Eye size={16} color={iconColor} />
                  <Text className="ml-2">Ver todos los pagos</Text>
                </Button>
              </>
            ) : (
              <Text className="text-muted-foreground text-center py-4">
                No hay pagos registrados
              </Text>
            )}
          </View>
        </ExpandableSection>
      </ScrollView>
    </View>
  );
}