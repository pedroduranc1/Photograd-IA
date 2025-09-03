import React, { useState, useMemo } from 'react';
import {
  View,
  FlatList,
  Alert,
  Linking,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '~/src/components/ui/text';
import { Button } from '~/src/components/ui/button';
import { SearchInput } from '~/src/components/ui/search-input';
import { Card } from '~/src/components/ui/card';
import { SchoolModal } from '~/src/components/ui/school-modal';
import { useColorScheme } from '~/src/hooks/ui/useColorScheme';
import { 
  useUserSchools, 
  useCreateSchool, 
  useUpdateSchool, 
  useDeleteSchool 
} from '~/src/hooks/data/use-school-queries';
import { useAuthStore } from '~/src/store/auth-store';
import type { SchoolWithStats } from '~/src/types/database';
import { GraduationCap } from '~/src/components/ui/icons/GraduationCap';
import { Phone } from '~/src/components/ui/icons/Phone';
import { Mail } from '~/src/components/ui/icons/Mail';
import { MapPin } from '~/src/components/ui/icons/MapPin';
import { Edit } from '~/src/components/ui/icons/Edit';
import { Trash2 } from '~/src/components/ui/icons/Trash2';

export default function EscuelasScreenWeb() {
  const { isDarkColorScheme } = useColorScheme();
  const router = useRouter();
  const { user } = useAuthStore();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<SchoolWithStats | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Queries and mutations
  const { 
    data: schoolsData, 
    isLoading, 
    error, 
    refetch 
  } = useUserSchools(user?.id || '', { limit: 50 });
  
  const createSchoolMutation = useCreateSchool();
  const updateSchoolMutation = useUpdateSchool();
  const deleteSchoolMutation = useDeleteSchool();

  const schools = schoolsData?.data || [];

  // Filtered schools based on search
  const filteredSchools = useMemo(() => {
    if (!searchQuery.trim()) return schools;
    
    const query = searchQuery.toLowerCase().trim();
    return schools.filter(
      (school) =>
        school.name.toLowerCase().includes(query) ||
        school.address.toLowerCase().includes(query)
    );
  }, [schools, searchQuery]);

  const handleRefresh = async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing schools:', error);
    }
  };

  const handleAddSchool = () => {
    setModalMode('add');
    setSelectedSchool(null);
    setModalVisible(true);
  };

  const handleEditSchool = (school: SchoolWithStats) => {
    setModalMode('edit');
    setSelectedSchool(school);
    setModalVisible(true);
  };

  const handleDeleteSchool = (school: SchoolWithStats) => {
    Alert.alert(
      'Eliminar Escuela',
      `¿Estás seguro de que quieres eliminar "${school.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSchoolMutation.mutateAsync(school.id);
              Alert.alert('Éxito', 'Escuela eliminada correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la escuela');
              console.error('Error deleting school:', error);
            }
          },
        },
      ]
    );
  };

  const handleSaveSchool = async (schoolData: Partial<SchoolWithStats>) => {
    if (!user?.id) {
      Alert.alert('Error', 'Usuario no autenticado');
      return;
    }

    try {
      if (modalMode === 'add') {
        const newSchool = {
          ...schoolData,
          id: `school_${Date.now()}`,
          userId: user.id,
          status: 'active' as const,
          debtAmount: 0,
        };
        
        await createSchoolMutation.mutateAsync(newSchool as any);
        Alert.alert('Éxito', 'Escuela agregada correctamente');
      } else if (selectedSchool) {
        await updateSchoolMutation.mutateAsync({
          id: selectedSchool.id,
          updates: schoolData,
        });
        Alert.alert('Éxito', 'Escuela actualizada correctamente');
      }
      
      setModalVisible(false);
      setSelectedSchool(null);
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la escuela');
      console.error('Error saving school:', error);
    }
  };

  const handleSchoolPress = (school: SchoolWithStats) => {
    router.push(`/(protected)/escuelas/${school.id}`);
  };

  const handleCall = (school: SchoolWithStats, event: any) => {
    event.stopPropagation();
    if (school.phone) {
      Linking.openURL(`tel:${school.phone}`);
    }
  };

  const handleEmail = (school: SchoolWithStats, event: any) => {
    event.stopPropagation();
    if (school.email) {
      Linking.openURL(`mailto:${school.email}`);
    }
  };

  const renderGridItem = ({ item: school }: { item: SchoolWithStats }) => (
    <TouchableOpacity
      onPress={() => handleSchoolPress(school)}
      className="flex-1 m-2"
      accessibilityRole="button"
      accessibilityLabel={`View school ${school.name}`}
    >
      <Card className="p-6 hover:shadow-lg transition-shadow h-64">
        <View className="flex-1">
          {/* Header */}
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-1 mr-4">
              <Text className="text-lg font-bold text-foreground mb-1 truncate">
                {school.name}
              </Text>
              <View className="flex-row items-center">
                <View className={`w-2 h-2 rounded-full mr-2 ${
                  school.status === 'active' ? 'bg-green-500' : 
                  school.status === 'inactive' ? 'bg-gray-500' : 'bg-red-500'
                }`} />
                <Text className="text-xs text-muted-foreground capitalize">
                  {school.status}
                </Text>
              </View>
            </View>
            <View className="flex-row space-x-1">
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleEditSchool(school);
                }}
                className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                accessibilityRole="button"
                accessibilityLabel="Edit school"
              >
                <Edit size={16} className="text-muted-foreground" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteSchool(school);
                }}
                className="p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                accessibilityRole="button"
                accessibilityLabel="Delete school"
              >
                <Trash2 size={16} className="text-red-500" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              <MapPin size={14} className="text-muted-foreground mr-2" />
              <Text className="text-sm text-muted-foreground flex-1" numberOfLines={2}>
                {school.address}
              </Text>
            </View>
            
            {school.phone && (
              <TouchableOpacity
                onPress={(e) => handleCall(school, e)}
                className="flex-row items-center mb-2 p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800/50"
                accessibilityRole="button"
                accessibilityLabel={`Call ${school.phone}`}
              >
                <Phone size={14} className="text-muted-foreground mr-2" />
                <Text className="text-sm text-muted-foreground">
                  {school.phone}
                </Text>
              </TouchableOpacity>
            )}
            
            {school.email && (
              <TouchableOpacity
                onPress={(e) => handleEmail(school, e)}
                className="flex-row items-center mb-3 p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800/50"
                accessibilityRole="button"
                accessibilityLabel={`Email ${school.email}`}
              >
                <Mail size={14} className="text-muted-foreground mr-2" />
                <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                  {school.email}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Footer Stats */}
          <View className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-auto">
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-xs text-muted-foreground">Grados</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {school.totalGrades || 0}
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-xs text-muted-foreground">Estudiantes</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {school.totalStudents || 0}
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-xs text-muted-foreground">Deuda</Text>
                <Text className={`text-sm font-semibold ${
                  school.debtAmount > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  ${school.debtAmount || 0}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <GraduationCap size={64} className="text-muted-foreground mb-6" />
      <Text className="text-2xl font-semibold text-foreground mb-2 text-center">
        {searchQuery ? 'No se encontraron escuelas' : 'No hay escuelas registradas'}
      </Text>
      <Text className="text-muted-foreground text-center mb-8 max-w-md">
        {searchQuery
          ? `No encontramos escuelas que coincidan con "${searchQuery}"`
          : 'Comienza agregando tu primera escuela asociada para gestionar estudiantes y grados'}
      </Text>
      {!searchQuery && (
        <Button onPress={handleAddSchool} size="lg" className="px-8">
          <Text className="text-primary-foreground font-medium">
            Agregar Primera Escuela
          </Text>
        </Button>
      )}
    </View>
  );

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator 
          size="large" 
          color={isDarkColorScheme ? '#22C55E' : '#16A34A'} 
        />
        <Text className="text-muted-foreground mt-4">
          Cargando escuelas...
        </Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <Text className="text-xl font-semibold text-foreground mb-2 text-center">
          Error al cargar escuelas
        </Text>
        <Text className="text-muted-foreground text-center mb-6">
          {error.message || 'Ha ocurrido un error inesperado'}
        </Text>
        <Button onPress={handleRefresh}>
          <Text className="text-primary-foreground">Reintentar</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header Section */}
      <View className="px-6 py-6 border-b border-slate-200 dark:border-slate-700">
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-3xl font-bold text-foreground mb-2">
              Escuelas Asociadas
            </Text>
            <Text className="text-muted-foreground">
              {filteredSchools.length} {filteredSchools.length === 1 ? 'escuela' : 'escuelas'} registradas
            </Text>
          </View>
          
          <View className="flex-row space-x-3">
            <Button 
              variant="outline"
              onPress={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
            >
              <Text>{viewMode === 'grid' ? 'Vista Tabla' : 'Vista Grid'}</Text>
            </Button>
            <Button onPress={handleAddSchool} size="lg">
              <Text className="text-primary-foreground font-medium">
                + Agregar Escuela
              </Text>
            </Button>
          </View>
        </View>
        
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por nombre o dirección..."
          className="max-w-md"
        />
      </View>

      {/* Content */}
      <View className="flex-1">
        {filteredSchools.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={filteredSchools}
            renderItem={renderGridItem}
            keyExtractor={(item) => item.id}
            numColumns={viewMode === 'grid' ? 3 : 1}
            key={viewMode} // Force re-render when changing view mode
            contentContainerStyle={{
              padding: 16,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={true}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={handleRefresh}
                tintColor={isDarkColorScheme ? '#22C55E' : '#16A34A'}
              />
            }
            // Performance optimizations
            removeClippedSubviews={true}
            maxToRenderPerBatch={12}
            windowSize={10}
            getItemLayout={viewMode === 'grid' ? undefined : (data, index) => ({
              length: 280, // Approximate height
              offset: 280 * index,
              index,
            })}
          />
        )}
      </View>

      {/* Add/Edit Modal */}
      <SchoolModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedSchool(null);
        }}
        onSave={handleSaveSchool}
        school={selectedSchool}
        mode={modalMode}
        loading={createSchoolMutation.isPending || updateSchoolMutation.isPending}
      />
    </View>
  );
}