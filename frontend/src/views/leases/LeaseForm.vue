<template>
  <div class="container-fluid py-4">
    <!-- Header Section -->
    <div class="row mb-4">
      <div class="col-md-6">
        <h1 class="h3 mb-0">
          <i class="bi bi-file-plus me-2"></i>
          {{ isEditing ? 'Edit Lease' : 'New Lease' }}
        </h1>
        <p class="text-muted">{{ isEditing ? 'Update lease information' : 'Create a new lease agreement' }}</p>
      </div>
      <div class="col-md-6 text-md-end">
        <button 
          type="button" 
          class="btn btn-outline-secondary me-2"
          @click="goBack"
          :disabled="loading"
        >
          <i class="bi bi-arrow-left me-1"></i>
          Back to Leases
        </button>
        <button 
          type="submit" 
          form="leaseForm"
          class="btn btn-primary"
          :disabled="loading || !isFormValid"
        >
          <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
          <i v-else class="bi bi-check-lg me-1"></i>
          {{ isEditing ? 'Update Lease' : 'Create Lease' }}
        </button>
      </div>
    </div>

    <!-- Main Form -->
    <div class="row">
      <div class="col-lg-8">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">
              <i class="bi bi-info-circle me-2"></i>
              Lease Information
            </h5>
          </div>
          <div class="card-body">
            <form id="leaseForm" @submit.prevent="submitForm">
              <div class="row">
                <!-- Property Selection -->
                <div class="col-md-6 mb-3">
                  <label for="propertyId" class="form-label">
                    Property <span class="text-danger">*</span>
                  </label>
                  <div class="input-group">
                    <select 
                      id="propertyId"
                      v-model="formData.propertyId" 
                      class="form-select"
                      :class="{ 'is-invalid': errors.propertyId }"
                      required
                    >
                      <option value="">Select a property</option>
                      <option 
                        v-for="property in availableProperties" 
                        :key="property.id" 
                        :value="property.id"
                      >
                        {{ property.title || (property.street + ', ' + property.city) }}
                      </option>
                    </select>
                    <button 
                      type="button" 
                      class="btn btn-outline-primary"
                      @click="showNewPropertyModal = true"
                      title="Add New Property"
                    >
                      <i class="bi bi-plus-lg"></i>
                    </button>
                  </div>
                  <div v-if="errors.propertyId" class="invalid-feedback">
                    {{ errors.propertyId }}
                  </div>
                </div>

                <!-- Tenant Selection -->
                <div class="col-md-6 mb-3">
                  <label class="form-label">
                    Tenants <span class="text-danger">*</span>
                  </label>
                  <div class="border rounded p-3" :class="{ 'border-danger': errors.tenantIds }">
                    <div v-if="formData.tenantIds.length === 0" class="text-muted">
                      No tenants selected
                    </div>
                    <div v-else class="mb-2">
                      <div 
                        v-for="(tenantId, index) in formData.tenantIds" 
                        :key="tenantId"
                        class="d-flex align-items-center justify-content-between mb-2 p-2 bg-light rounded"
                      >
                        <div>
                          <strong>{{ getTenantName(tenantId) }}</strong>
                          <span v-if="index === 0" class="badge bg-primary ms-2">Primary</span>
                        </div>
                        <button 
                          type="button" 
                          class="btn btn-sm btn-outline-danger"
                          @click="removeTenant(index)"
                        >
                          <i class="bi bi-x"></i>
                        </button>
                      </div>
                    </div>
                    <div class="d-flex gap-2">
                      <select 
                        class="form-select"
                        @change="addTenant($event.target.value); $event.target.value = ''"
                      >
                        <option value="">Add a tenant...</option>
                        <option 
                          v-for="tenant in availableTenantsForSelection" 
                          :key="tenant.id" 
                          :value="tenant.id"
                        >
                          {{ tenant.first_name }} {{ tenant.last_name }}
                        </option>
                      </select>
                      <button 
                        type="button" 
                        class="btn btn-outline-primary"
                        @click="showNewTenantModal = true"
                        title="Add New Tenant"
                      >
                        <i class="bi bi-plus-lg"></i>
                      </button>
                    </div>
                  </div>
                  <div v-if="errors.tenantIds" class="text-danger small mt-1">
                    {{ errors.tenantIds }}
                  </div>
                </div>

                <!-- Landlord Selection -->
                <div class="col-md-6 mb-3">
                  <label class="form-label">
                    Landlords <span class="text-danger">*</span>
                  </label>
                  <div class="border rounded p-3" :class="{ 'border-danger': errors.landlordIds }">
                    <div v-if="formData.landlordIds.length === 0" class="text-muted">
                      No landlords selected
                    </div>
                    <div v-else class="mb-2">
                      <div 
                        v-for="(landlordId, index) in formData.landlordIds" 
                        :key="landlordId"
                        class="d-flex align-items-center justify-content-between mb-2 p-2 bg-light rounded"
                      >
                        <div>
                          <strong>{{ getLandlordName(landlordId) }}</strong>
                          <span v-if="index === 0" class="badge bg-primary ms-2">Primary</span>
                        </div>
                        <button 
                          type="button" 
                          class="btn btn-sm btn-outline-danger"
                          @click="removeLandlord(index)"
                        >
                          <i class="bi bi-x"></i>
                        </button>
                      </div>
                    </div>
                    <div class="d-flex gap-2">
                      <select 
                        class="form-select"
                        @change="addLandlord($event.target.value); $event.target.value = ''"
                      >
                        <option value="">Add a landlord...</option>
                        <option 
                          v-for="landlord in availableLandlordsForSelection" 
                          :key="landlord.id" 
                          :value="landlord.id"
                        >
                          {{ landlord.first_name }} {{ landlord.last_name }}
                        </option>
                      </select>
                      <button 
                        type="button" 
                        class="btn btn-outline-primary"
                        @click="showNewLandlordModal = true"
                        title="Add New Landlord"
                      >
                        <i class="bi bi-plus-lg"></i>
                      </button>
                    </div>
                  </div>
                  <div v-if="errors.landlordIds" class="text-danger small mt-1">
                    {{ errors.landlordIds }}
                  </div>
                </div>

                <!-- Start Date -->
                <div class="col-md-6 mb-3">
                  <label for="startDate" class="form-label">
                    Start Date <span class="text-danger">*</span>
                  </label>
                  <input 
                    id="startDate"
                    type="date" 
                    v-model="formData.startDate" 
                    class="form-control"
                    :class="{ 'is-invalid': errors.startDate }"
                    required
                  >
                  <div v-if="errors.startDate" class="invalid-feedback">
                    {{ errors.startDate }}
                  </div>
                </div>

                <!-- End Date -->
                <div class="col-md-6 mb-3">
                  <label for="endDate" class="form-label">
                    End Date <span class="text-danger">*</span>
                  </label>
                  <input 
                    id="endDate"
                    type="date" 
                    v-model="formData.endDate" 
                    class="form-control"
                    :class="{ 'is-invalid': errors.endDate }"
                    :min="formData.startDate"
                    required
                  >
                  <div v-if="errors.endDate" class="invalid-feedback">
                    {{ errors.endDate }}
                  </div>
                </div>

                <!-- Monthly Rent -->
                <div class="col-md-6 mb-3">
                  <label for="monthlyRent" class="form-label">
                    Monthly Rent <span class="text-danger">*</span>
                  </label>
                  <div class="input-group">
                    <span class="input-group-text">$</span>
                    <input 
                      id="monthlyRent"
                      type="number" 
                      v-model="formData.monthlyRent" 
                      class="form-control"
                      :class="{ 'is-invalid': errors.monthlyRent }"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      required
                    >
                    <div v-if="errors.monthlyRent" class="invalid-feedback">
                      {{ errors.monthlyRent }}
                    </div>
                  </div>
                </div>

                <!-- Security Deposit -->
                <div class="col-md-6 mb-3">
                  <label for="securityDeposit" class="form-label">
                    Security Deposit
                  </label>
                  <div class="input-group">
                    <span class="input-group-text">$</span>
                    <input 
                      id="securityDeposit"
                      type="number" 
                      v-model="formData.securityDeposit" 
                      class="form-control"
                      :class="{ 'is-invalid': errors.securityDeposit }"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                    >
                    <div v-if="errors.securityDeposit" class="invalid-feedback">
                      {{ errors.securityDeposit }}
                    </div>
                  </div>
                </div>

                <!-- Lease Type -->
                <div class="col-md-6 mb-3">
                  <label for="leaseType" class="form-label">
                    Lease Type <span class="text-danger">*</span>
                  </label>
                  <select 
                    id="leaseType"
                    v-model="formData.leaseType" 
                    class="form-select"
                    :class="{ 'is-invalid': errors.leaseType }"
                    required
                  >
                    <option value="">Select lease type</option>
                    <option value="fixed">Fixed Term</option>
                    <option value="month-to-month">Month-to-Month</option>
                    <option value="yearly">Yearly</option>
                  </select>
                  <div v-if="errors.leaseType" class="invalid-feedback">
                    {{ errors.leaseType }}
                  </div>
                </div>

                <!-- Status -->
                <div class="col-md-6 mb-3">
                  <label for="status" class="form-label">
                    Status <span class="text-danger">*</span>
                  </label>
                  <select 
                    id="status"
                    v-model="formData.status" 
                    class="form-select"
                    :class="{ 'is-invalid': errors.status }"
                    required
                  >
                    <option value="">Select status</option>
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="terminated">Terminated</option>
                  </select>
                  <div v-if="errors.status" class="invalid-feedback">
                    {{ errors.status }}
                  </div>
                </div>

                <!-- Lease Term (calculated) -->
                <div class="col-md-6 mb-3" v-if="formData.startDate && formData.endDate">
                  <label class="form-label">Lease Term</label>
                  <input 
                    type="text" 
                    class="form-control"
                    :value="leaseTermText"
                    readonly
                  >
                </div>

                <!-- Notes -->
                <div class="col-12 mb-3">
                  <label for="notes" class="form-label">Notes</label>
                  <textarea 
                    id="notes"
                    v-model="formData.notes" 
                    class="form-control"
                    :class="{ 'is-invalid': errors.notes }"
                    rows="3"
                    placeholder="Additional notes or terms..."
                  ></textarea>
                  <div v-if="errors.notes" class="invalid-feedback">
                    {{ errors.notes }}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Summary Card -->
      <div class="col-lg-4">
        <div class="card position-sticky" style="top: 2rem;">
          <div class="card-header">
            <h5 class="card-title mb-0">
              <i class="bi bi-card-checklist me-2"></i>
              Lease Summary
            </h5>
          </div>
          <div class="card-body">
            <div v-if="selectedProperty" class="mb-3">
              <h6 class="text-muted mb-1">Property</h6>
              <p class="mb-0">{{ selectedProperty.title || (selectedProperty.street + ', ' + selectedProperty.city) }}</p>
              <small class="text-muted">{{ selectedProperty.city }}, {{ selectedProperty.state }}</small>
            </div>

            <div v-if="selectedTenants.length > 0" class="mb-3">
              <h6 class="text-muted mb-1">Tenant{{ selectedTenants.length > 1 ? 's' : '' }}</h6>
              <div v-for="(tenant, index) in selectedTenants" :key="tenant.id" class="mb-1">
                <p class="mb-0">
                  {{ tenant.first_name }} {{ tenant.last_name }}
                  <span v-if="index === 0" class="badge bg-primary ms-1">Primary</span>
                </p>
                <small class="text-muted">{{ tenant.email }}</small>
              </div>
            </div>

            <div v-if="selectedLandlords.length > 0" class="mb-3">
              <h6 class="text-muted mb-1">Landlord{{ selectedLandlords.length > 1 ? 's' : '' }}</h6>
              <div v-for="(landlord, index) in selectedLandlords" :key="landlord.id" class="mb-1">
                <p class="mb-0">
                  {{ landlord.first_name }} {{ landlord.last_name }}
                  <span v-if="index === 0" class="badge bg-primary ms-1">Primary</span>
                </p>
                <small class="text-muted">{{ landlord.email }}</small>
              </div>
            </div>

            <div v-if="formData.startDate && formData.endDate" class="mb-3">
              <h6 class="text-muted mb-1">Lease Period</h6>
              <p class="mb-0">{{ formatDate(formData.startDate) }} - {{ formatDate(formData.endDate) }}</p>
              <small class="text-muted">{{ leaseTermText }}</small>
            </div>

            <div v-if="formData.monthlyRent" class="mb-3">
              <h6 class="text-muted mb-1">Monthly Rent</h6>
              <p class="mb-0 fs-5 fw-bold text-success">${{ formData.monthlyRent }}</p>
            </div>

            <div v-if="formData.securityDeposit" class="mb-3">
              <h6 class="text-muted mb-1">Security Deposit</h6>
              <p class="mb-0">${{ formData.securityDeposit }}</p>
            </div>

            <div v-if="formData.status" class="mb-3">
              <h6 class="text-muted mb-1">Status</h6>
              <span :class="getStatusBadgeClass(formData.status)">
                {{ formData.status.charAt(0).toUpperCase() + formData.status.slice(1) }}
              </span>
            </div>

            <hr>
            <div class="d-grid">
              <button 
                type="submit" 
                form="leaseForm"
                class="btn btn-primary"
                :disabled="loading || !isFormValid"
              >
                <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                <i v-else class="bi bi-check-lg me-1"></i>
                {{ isEditing ? 'Update Lease' : 'Create Lease' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- New Property Modal -->
    <div class="modal fade" id="newPropertyModal" tabindex="-1" v-if="showNewPropertyModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-building-add me-2"></i>
              Add New Property
            </h5>
            <button type="button" class="btn-close" @click="closeNewPropertyModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="createProperty">
              <div class="row">
                <div class="col-12 mb-3">
                  <label for="newPropertyTitle" class="form-label">
                    Property Title <span class="text-danger">*</span>
                  </label>
                  <input 
                    id="newPropertyTitle"
                    type="text" 
                    v-model="newProperty.title" 
                    class="form-control"
                    :class="{ 'is-invalid': newPropertyErrors.title }"
                    required
                    placeholder="e.g., Sunset Apartments Unit 5A"
                  >
                  <div v-if="newPropertyErrors.title" class="invalid-feedback">
                    {{ newPropertyErrors.title }}
                  </div>
                </div>
                
                <div class="col-12 mb-3">
                  <label for="newPropertyStreet" class="form-label">
                    Street Address <span class="text-danger">*</span>
                  </label>
                  <input 
                    id="newPropertyStreet"
                    type="text" 
                    v-model="newProperty.street" 
                    class="form-control"
                    :class="{ 'is-invalid': newPropertyErrors.street }"
                    required
                    placeholder="123 Main Street"
                  >
                  <div v-if="newPropertyErrors.street" class="invalid-feedback">
                    {{ newPropertyErrors.street }}
                  </div>
                </div>

                <div class="col-md-6 mb-3">
                  <label for="newPropertyCity" class="form-label">
                    City <span class="text-danger">*</span>
                  </label>
                  <input 
                    id="newPropertyCity"
                    type="text" 
                    v-model="newProperty.city" 
                    class="form-control"
                    :class="{ 'is-invalid': newPropertyErrors.city }"
                    required
                    placeholder="New York"
                  >
                  <div v-if="newPropertyErrors.city" class="invalid-feedback">
                    {{ newPropertyErrors.city }}
                  </div>
                </div>

                <div class="col-md-3 mb-3">
                  <label for="newPropertyState" class="form-label">
                    State <span class="text-danger">*</span>
                  </label>
                  <input 
                    id="newPropertyState"
                    type="text" 
                    v-model="newProperty.state" 
                    class="form-control"
                    :class="{ 'is-invalid': newPropertyErrors.state }"
                    required
                    placeholder="NY"
                  >
                  <div v-if="newPropertyErrors.state" class="invalid-feedback">
                    {{ newPropertyErrors.state }}
                  </div>
                </div>

                <div class="col-md-3 mb-3">
                  <label for="newPropertyZipCode" class="form-label">
                    Zip Code <span class="text-danger">*</span>
                  </label>
                  <input 
                    id="newPropertyZipCode"
                    type="text" 
                    v-model="newProperty.zip_code" 
                    class="form-control"
                    :class="{ 'is-invalid': newPropertyErrors.zip_code }"
                    required
                    placeholder="10001"
                  >
                  <div v-if="newPropertyErrors.zip_code" class="invalid-feedback">
                    {{ newPropertyErrors.zip_code }}
                  </div>
                </div>

                <div class="col-12 mb-3">
                  <label for="newPropertyType" class="form-label">
                    Property Type <span class="text-danger">*</span>
                  </label>
                  <select 
                    id="newPropertyType"
                    v-model="newProperty.property_type" 
                    class="form-select"
                    :class="{ 'is-invalid': newPropertyErrors.property_type }"
                    required
                  >
                    <option value="">Select property type</option>
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="condo">Condo</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="duplex">Duplex</option>
                    <option value="studio">Studio</option>
                    <option value="other">Other</option>
                  </select>
                  <div v-if="newPropertyErrors.property_type" class="invalid-feedback">
                    {{ newPropertyErrors.property_type }}
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeNewPropertyModal">
              Cancel
            </button>
            <button type="button" class="btn btn-primary" @click="createProperty" :disabled="creatingProperty">
              <span v-if="creatingProperty" class="spinner-border spinner-border-sm me-2"></span>
              Create Property
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- New Tenant Modal -->
    <div class="modal fade" id="newTenantModal" tabindex="-1" v-if="showNewTenantModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-person-plus me-2"></i>
              Add New Tenant
            </h5>
            <button type="button" class="btn-close" @click="closeNewTenantModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="createTenant">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="newTenantFirstName" class="form-label">
                    First Name <span class="text-danger">*</span>
                  </label>
                  <input 
                    id="newTenantFirstName"
                    type="text" 
                    v-model="newTenant.first_name" 
                    class="form-control"
                    :class="{ 'is-invalid': newTenantErrors.first_name }"
                    required
                    placeholder="John"
                  >
                  <div v-if="newTenantErrors.first_name" class="invalid-feedback">
                    {{ newTenantErrors.first_name }}
                  </div>
                </div>

                <div class="col-md-6 mb-3">
                  <label for="newTenantLastName" class="form-label">
                    Last Name <span class="text-danger">*</span>
                  </label>
                  <input 
                    id="newTenantLastName"
                    type="text" 
                    v-model="newTenant.last_name" 
                    class="form-control"
                    :class="{ 'is-invalid': newTenantErrors.last_name }"
                    required
                    placeholder="Smith"
                  >
                  <div v-if="newTenantErrors.last_name" class="invalid-feedback">
                    {{ newTenantErrors.last_name }}
                  </div>
                </div>

                <div class="col-12 mb-3">
                  <label for="newTenantEmail" class="form-label">
                    Email <span class="text-danger">*</span>
                  </label>
                  <input 
                    id="newTenantEmail"
                    type="email" 
                    v-model="newTenant.email" 
                    class="form-control"
                    :class="{ 'is-invalid': newTenantErrors.email }"
                    required
                    placeholder="john.smith@example.com"
                  >
                  <div v-if="newTenantErrors.email" class="invalid-feedback">
                    {{ newTenantErrors.email }}
                  </div>
                </div>

                <div class="col-12 mb-3">
                  <label for="newTenantPhone" class="form-label">
                    Phone <span class="text-danger">*</span>
                  </label>
                  <input 
                    id="newTenantPhone"
                    type="tel" 
                    v-model="newTenant.phone" 
                    class="form-control"
                    :class="{ 'is-invalid': newTenantErrors.phone }"
                    required
                    placeholder="(555) 123-4567"
                  >
                  <div v-if="newTenantErrors.phone" class="invalid-feedback">
                    {{ newTenantErrors.phone }}
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeNewTenantModal">
              Cancel
            </button>
            <button type="button" class="btn btn-primary" @click="createTenant" :disabled="creatingTenant">
              <span v-if="creatingTenant" class="spinner-border spinner-border-sm me-2"></span>
              Create Tenant
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- New Landlord Modal -->
    <div class="modal fade" id="newLandlordModal" tabindex="-1" v-if="showNewLandlordModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-person-badge me-2"></i>
              Add New Landlord
            </h5>
            <button type="button" class="btn-close" @click="closeNewLandlordModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="createLandlord">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="newLandlordFirstName" class="form-label">
                    First Name <span class="text-danger">*</span>
                  </label>
                  <input 
                    id="newLandlordFirstName"
                    type="text" 
                    v-model="newLandlord.first_name" 
                    class="form-control"
                    :class="{ 'is-invalid': newLandlordErrors.first_name }"
                    required
                    placeholder="Jane"
                  >
                  <div v-if="newLandlordErrors.first_name" class="invalid-feedback">
                    {{ newLandlordErrors.first_name }}
                  </div>
                </div>

                <div class="col-md-6 mb-3">
                  <label for="newLandlordLastName" class="form-label">
                    Last Name <span class="text-danger">*</span>
                  </label>
                  <input 
                    id="newLandlordLastName"
                    type="text" 
                    v-model="newLandlord.last_name" 
                    class="form-control"
                    :class="{ 'is-invalid': newLandlordErrors.last_name }"
                    required
                    placeholder="Doe"
                  >
                  <div v-if="newLandlordErrors.last_name" class="invalid-feedback">
                    {{ newLandlordErrors.last_name }}
                  </div>
                </div>

                <div class="col-12 mb-3">
                  <label for="newLandlordEmail" class="form-label">
                    Email <span class="text-danger">*</span>
                  </label>
                  <input 
                    id="newLandlordEmail"
                    type="email" 
                    v-model="newLandlord.email" 
                    class="form-control"
                    :class="{ 'is-invalid': newLandlordErrors.email }"
                    required
                    placeholder="jane.doe@example.com"
                  >
                  <div v-if="newLandlordErrors.email" class="invalid-feedback">
                    {{ newLandlordErrors.email }}
                  </div>
                </div>

                <div class="col-12 mb-3">
                  <label for="newLandlordPhone" class="form-label">
                    Phone <span class="text-danger">*</span>
                  </label>
                  <input 
                    id="newLandlordPhone"
                    type="tel" 
                    v-model="newLandlord.phone" 
                    class="form-control"
                    :class="{ 'is-invalid': newLandlordErrors.phone }"
                    required
                    placeholder="(555) 987-6543"
                  >
                  <div v-if="newLandlordErrors.phone" class="invalid-feedback">
                    {{ newLandlordErrors.phone }}
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeNewLandlordModal">
              Cancel
            </button>
            <button type="button" class="btn btn-primary" @click="createLandlord" :disabled="creatingLandlord">
              <span v-if="creatingLandlord" class="spinner-border spinner-border-sm me-2"></span>
              Create Landlord
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLeaseStore } from '@/stores/leaseStore'
import { usePropertyStore } from '@/stores/propertyStore'
import { useContactStore } from '@/stores/contactStore'
import { useAppStore } from '@/stores/app'

export default {
  name: 'LeaseForm',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const leaseStore = useLeaseStore()
    const propertyStore = usePropertyStore()
    const contactStore = useContactStore()
    const appStore = useAppStore()

    // Reactive data
    const loading = ref(false)
    const errors = ref({})
    const formData = ref({
      propertyId: '',
      tenantIds: [],
      landlordIds: [],
      startDate: '',
      endDate: '',
      monthlyRent: '',
      securityDeposit: '',
      leaseType: 'fixed',
      status: 'pending',
      notes: ''
    })

    // Modal data
    const showNewPropertyModal = ref(false)
    const showNewTenantModal = ref(false)
    const showNewLandlordModal = ref(false)
    const creatingProperty = ref(false)
    const creatingTenant = ref(false)
    const creatingLandlord = ref(false)

    const newProperty = ref({
      title: '',
      street: '',
      city: '',
      state: '',
      zip_code: '',
      property_type: ''
    })

    const newTenant = ref({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      contact_type: 'tenant'
    })

    const newLandlord = ref({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      contact_type: 'landlord'
    })

    const newPropertyErrors = ref({})
    const newTenantErrors = ref({})
    const newLandlordErrors = ref({})

    // Computed properties
    const isEditing = computed(() => !!route.params.id)
    const leaseId = computed(() => route.params.id)
    
    const availableProperties = computed(() => propertyStore.properties || [])
    const availableTenants = computed(() => {
      return (contactStore.contacts || []).filter(contact => 
        contact.contact_type === 'tenant' || contact.contact_type === 'both'
      )
    })
    const availableLandlords = computed(() => {
      return (contactStore.contacts || []).filter(contact => 
        contact.contact_type === 'landlord' || contact.contact_type === 'both'
      )
    })

    const availableTenantsForSelection = computed(() => {
      return availableTenants.value.filter(tenant => 
        !formData.value.tenantIds.includes(tenant.id)
      )
    })

    const availableLandlordsForSelection = computed(() => {
      return availableLandlords.value.filter(landlord => 
        !formData.value.landlordIds.includes(landlord.id)
      )
    })
    
    const selectedProperty = computed(() => {
      return availableProperties.value.find(p => p.id === formData.value.propertyId)
    })
    
    const selectedTenant = computed(() => {
      // Return the first tenant (primary) from the array
      const primaryTenantId = formData.value.tenantIds?.[0]
      return primaryTenantId ? availableTenants.value.find(t => t.id === primaryTenantId) : null
    })
    
    const selectedLandlord = computed(() => {
      // Return the first landlord (primary) from the array
      const primaryLandlordId = formData.value.landlordIds?.[0]
      return primaryLandlordId ? availableLandlords.value.find(l => l.id === primaryLandlordId) : null
    })

    const selectedTenants = computed(() => {
      return formData.value.tenantIds?.map(id => 
        availableTenants.value.find(t => t.id === id)
      ).filter(Boolean) || []
    })

    const selectedLandlords = computed(() => {
      return formData.value.landlordIds?.map(id => 
        availableLandlords.value.find(l => l.id === id)
      ).filter(Boolean) || []
    })

    const leaseTermText = computed(() => {
      if (!formData.value.startDate || !formData.value.endDate) return ''
      
      const start = new Date(formData.value.startDate)
      const end = new Date(formData.value.endDate)
      const diffTime = Math.abs(end - start)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const diffMonths = Math.round(diffDays / 30.44)
      
      if (diffMonths >= 12) {
        const years = Math.floor(diffMonths / 12)
        const remainingMonths = diffMonths % 12
        return `${years} year${years > 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''}`
      } else {
        return `${diffMonths} month${diffMonths > 1 ? 's' : ''}`
      }
    })

    const isFormValid = computed(() => {
      return formData.value.propertyId && 
             formData.value.tenantIds.length > 0 && 
             formData.value.landlordIds.length > 0 &&
             formData.value.startDate && 
             formData.value.endDate && 
             formData.value.monthlyRent && 
             formData.value.leaseType &&
             formData.value.status &&
             Object.keys(errors.value).length === 0
    })

    // Methods
    const getTenantName = (tenantId) => {
      const tenant = availableTenants.value.find(t => t.id === tenantId)
      return tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unknown Tenant'
    }

    const getLandlordName = (landlordId) => {
      const landlord = availableLandlords.value.find(l => l.id === landlordId)
      return landlord ? `${landlord.first_name} ${landlord.last_name}` : 'Unknown Landlord'
    }

    const addTenant = (tenantId) => {
      if (tenantId && !formData.value.tenantIds.includes(tenantId)) {
        formData.value.tenantIds.push(tenantId)
        // Clear tenant validation error if exists
        if (errors.value.tenantIds) {
          delete errors.value.tenantIds
        }
      }
    }

    const removeTenant = (index) => {
      formData.value.tenantIds.splice(index, 1)
    }

    const addLandlord = (landlordId) => {
      if (landlordId && !formData.value.landlordIds.includes(landlordId)) {
        formData.value.landlordIds.push(landlordId)
        // Clear landlord validation error if exists
        if (errors.value.landlordIds) {
          delete errors.value.landlordIds
        }
      }
    }

    const removeLandlord = (index) => {
      formData.value.landlordIds.splice(index, 1)
    }

    const goBack = () => {
      router.push('/leases')
    }

    const formatDate = (dateString) => {
      if (!dateString) return ''
      return new Date(dateString).toLocaleDateString()
    }

    const getStatusBadgeClass = (status) => {
      const classes = 'badge '
      switch (status) {
        case 'active': return classes + 'bg-success'
        case 'pending': return classes + 'bg-warning text-dark'
        case 'expired': return classes + 'bg-danger'
        case 'terminated': return classes + 'bg-secondary'
        default: return classes + 'bg-secondary'
      }
    }

    const validateForm = () => {
      const newErrors = {}

      // Required field validation
      if (!formData.value.propertyId) {
        newErrors.propertyId = 'Property is required'
      }
      if (!formData.value.tenantIds || formData.value.tenantIds.length === 0) {
        newErrors.tenantIds = 'At least one tenant is required'
      }
      if (!formData.value.landlordIds || formData.value.landlordIds.length === 0) {
        newErrors.landlordIds = 'At least one landlord is required'
      }
      if (!formData.value.startDate) {
        newErrors.startDate = 'Start date is required'
      }
      if (!formData.value.endDate) {
        newErrors.endDate = 'End date is required'
      }
      if (!formData.value.monthlyRent) {
        newErrors.monthlyRent = 'Monthly rent is required'
      }
      if (!formData.value.leaseType) {
        newErrors.leaseType = 'Lease type is required'
      }
      if (!formData.value.status) {
        newErrors.status = 'Status is required'
      }

      // Date validation
      if (formData.value.startDate && formData.value.endDate) {
        const startDate = new Date(formData.value.startDate)
        const endDate = new Date(formData.value.endDate)
        
        if (endDate <= startDate) {
          newErrors.endDate = 'End date must be after start date'
        }
      }

      // Numeric validation
      if (formData.value.monthlyRent && (isNaN(formData.value.monthlyRent) || parseFloat(formData.value.monthlyRent) <= 0)) {
        newErrors.monthlyRent = 'Monthly rent must be a positive number'
      }
      
      if (formData.value.securityDeposit && (isNaN(formData.value.securityDeposit) || parseFloat(formData.value.securityDeposit) < 0)) {
        newErrors.securityDeposit = 'Security deposit must be zero or positive'
      }

      errors.value = newErrors
      return Object.keys(newErrors).length === 0
    }

    const loadLease = async () => {
      if (!isEditing.value) return

      try {
        loading.value = true
        await leaseStore.fetchLease(leaseId.value)
        
        const lease = leaseStore.currentLease
        if (lease) {
          // Handle tenant IDs - try new format first, fall back to old
          let tenantIds = []
          if (lease.tenants && Array.isArray(lease.tenants)) {
            // New format: multiple tenants
            tenantIds = lease.tenants.map(tenant => tenant.id)
          } else if (lease.tenant_id) {
            // Old format: single tenant
            tenantIds = [lease.tenant_id]
          } else if (lease.tenant && lease.tenant.id) {
            // Nested tenant object
            tenantIds = [lease.tenant.id]
          }

          // Handle landlord IDs - try new format first, fall back to old
          let landlordIds = []
          if (lease.landlords && Array.isArray(lease.landlords)) {
            // New format: multiple landlords
            landlordIds = lease.landlords.map(landlord => landlord.id)
          } else if (lease.landlord_id) {
            // Old format: single landlord
            landlordIds = [lease.landlord_id]
          } else if (lease.landlord && lease.landlord.id) {
            // Nested landlord object
            landlordIds = [lease.landlord.id]
          }

          formData.value = {
            propertyId: lease.property_id || '',
            tenantIds: tenantIds,
            landlordIds: landlordIds,
            startDate: lease.start_date ? lease.start_date.split('T')[0] : '',
            endDate: lease.end_date ? lease.end_date.split('T')[0] : '',
            monthlyRent: lease.monthly_rent || '',
            securityDeposit: lease.security_deposit || '',
            leaseType: lease.lease_type || 'fixed',
            status: lease.status || 'pending',
            notes: lease.notes || ''
          }

          console.log('Loaded lease data:', {
            tenantIds,
            landlordIds,
            tenants: lease.tenants,
            landlords: lease.landlords
          })
        }
      } catch (error) {
        console.error('Failed to load lease:', error)
        appStore.showError('Failed to load lease')
        goBack()
      } finally {
        loading.value = false
      }
    }

    // Modal functions
    const closeNewPropertyModal = () => {
      // Hide Bootstrap modal first
      const modalElement = document.getElementById('newPropertyModal')
      if (modalElement) {
        import('bootstrap').then(bootstrap => {
          const modal = bootstrap.Modal.getInstance(modalElement)
          if (modal) {
            modal.hide()
          }
        })
      }
      
      showNewPropertyModal.value = false
      newProperty.value = {
        title: '',
        street: '',
        city: '',
        state: '',
        zip_code: '',
        property_type: ''
      }
      newPropertyErrors.value = {}
    }

    const closeNewTenantModal = () => {
      // Hide Bootstrap modal first
      const modalElement = document.getElementById('newTenantModal')
      if (modalElement) {
        import('bootstrap').then(bootstrap => {
          const modal = bootstrap.Modal.getInstance(modalElement)
          if (modal) {
            modal.hide()
          }
        })
      }
      
      showNewTenantModal.value = false
      newTenant.value = {
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        contact_type: 'tenant'
      }
      newTenantErrors.value = {}
    }

    const closeNewLandlordModal = () => {
      // Hide Bootstrap modal first
      const modalElement = document.getElementById('newLandlordModal')
      if (modalElement) {
        import('bootstrap').then(bootstrap => {
          const modal = bootstrap.Modal.getInstance(modalElement)
          if (modal) {
            modal.hide()
          }
        })
      }
      
      showNewLandlordModal.value = false
      newLandlord.value = {
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        contact_type: 'landlord'
      }
      newLandlordErrors.value = {}
    }

    const createProperty = async () => {
      try {
        creatingProperty.value = true
        newPropertyErrors.value = {}

        const response = await propertyStore.createProperty(newProperty.value)
        if (response) {
          formData.value.propertyId = response.id
          await propertyStore.fetchProperties()
          appStore.showSuccess('Property created successfully!')
          
          // Close modal properly
          const modalElement = document.getElementById('newPropertyModal')
          if (modalElement) {
            import('bootstrap').then(bootstrap => {
              const modal = bootstrap.Modal.getInstance(modalElement)
              if (modal) {
                modal.hide()
              }
            })
          }
          showNewPropertyModal.value = false
          
          // Reset form
          newProperty.value = {
            title: '',
            street: '',
            city: '',
            state: '',
            zip_code: '',
            property_type: ''
          }
          newPropertyErrors.value = {}
        }
      } catch (error) {
        console.error('Error creating property:', error)
        if (error.response?.data?.errors) {
          newPropertyErrors.value = error.response.data.errors
        } else {
          appStore.showError('Failed to create property')
        }
      } finally {
        creatingProperty.value = false
      }
    }

    const createTenant = async () => {
      try {
        creatingTenant.value = true
        newTenantErrors.value = {}

        const response = await contactStore.createContact(newTenant.value)
        if (response) {
          formData.value.tenantIds.push(response.id)
          await contactStore.fetchContacts()
          appStore.showSuccess('Tenant created successfully!')
          
          // Close modal properly
          const modalElement = document.getElementById('newTenantModal')
          if (modalElement) {
            import('bootstrap').then(bootstrap => {
              const modal = bootstrap.Modal.getInstance(modalElement)
              if (modal) {
                modal.hide()
              }
            })
          }
          showNewTenantModal.value = false
          
          // Reset form
          newTenant.value = {
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            contact_type: 'tenant'
          }
          newTenantErrors.value = {}
        }
      } catch (error) {
        console.error('Error creating tenant:', error)
        if (error.response?.data?.errors) {
          newTenantErrors.value = error.response.data.errors
        } else {
          appStore.showError('Failed to create tenant')
        }
      } finally {
        creatingTenant.value = false
      }
    }

    const createLandlord = async () => {
      try {
        creatingLandlord.value = true
        newLandlordErrors.value = {}

        const response = await contactStore.createContact(newLandlord.value)
        if (response) {
          formData.value.landlordIds.push(response.id)
          await contactStore.fetchContacts()
          appStore.showSuccess('Landlord created successfully!')
          
          // Close modal properly
          const modalElement = document.getElementById('newLandlordModal')
          if (modalElement) {
            import('bootstrap').then(bootstrap => {
              const modal = bootstrap.Modal.getInstance(modalElement)
              if (modal) {
                modal.hide()
              }
            })
          }
          showNewLandlordModal.value = false
          
          // Reset form
          newLandlord.value = {
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            contact_type: 'landlord'
          }
          newLandlordErrors.value = {}
        }
      } catch (error) {
        console.error('Error creating landlord:', error)
        if (error.response?.data?.errors) {
          newLandlordErrors.value = error.response.data.errors
        } else {
          appStore.showError('Failed to create landlord')
        }
      } finally {
        creatingLandlord.value = false
      }
    }

    const submitForm = async () => {
      if (!validateForm()) {
        return
      }

      try {
        loading.value = true
        
        // Create tenants array with primary designation
        const tenants = formData.value.tenantIds.map((tenantId, index) => ({
          id: tenantId,
          isPrimary: index === 0 // First tenant is primary
        }))

        // Create landlords array with primary designation
        const landlords = formData.value.landlordIds.map((landlordId, index) => ({
          id: landlordId,
          isPrimary: index === 0 // First landlord is primary
        }))

        const leaseData = {
          property: formData.value.propertyId,
          tenants: tenants,
          landlords: landlords,
          // Keep backward compatibility for single tenant/landlord
          tenant: tenants[0]?.id,
          landlord: landlords[0]?.id,
          startDate: formData.value.startDate,
          endDate: formData.value.endDate,
          monthlyRent: parseFloat(formData.value.monthlyRent),
          securityDeposit: formData.value.securityDeposit ? parseFloat(formData.value.securityDeposit) : null,
          leaseType: formData.value.leaseType,
          status: formData.value.status,
          notes: formData.value.notes
        }

        if (isEditing.value) {
          await leaseStore.updateLease(leaseId.value, leaseData)
          appStore.showSuccess('Lease updated successfully')
        } else {
          await leaseStore.createLease(leaseData)
          appStore.showSuccess('Lease created successfully')
        }

        goBack()
      } catch (error) {
        console.error('Failed to save lease:', error)
        appStore.showError(
          isEditing.value ? 'Failed to update lease' : 'Failed to create lease'
        )
      } finally {
        loading.value = false
      }
    }

    // Watchers
    watch(() => formData.value, validateForm, { deep: true })

    // Lifecycle
    onMounted(async () => {
      // Load required data
      await Promise.all([
        propertyStore.fetchProperties(),
        contactStore.fetchContacts()
      ])
      
      // Load lease data if editing
      if (isEditing.value) {
        await loadLease()
      }
    })

    // Watch for modal state changes to show/hide Bootstrap modals
    watch(showNewPropertyModal, (show) => {
      if (show) {
        setTimeout(() => {
          const modalElement = document.getElementById('newPropertyModal')
          if (modalElement) {
            import('bootstrap').then(bootstrap => {
              const modal = new bootstrap.Modal(modalElement, {
                backdrop: true,
                keyboard: true
              })
              modal.show()
              
              // Handle modal hidden event
              modalElement.addEventListener('hidden.bs.modal', () => {
                showNewPropertyModal.value = false
                // Clean up any remaining backdrop
                const backdrop = document.querySelector('.modal-backdrop')
                if (backdrop) {
                  backdrop.remove()
                }
                document.body.classList.remove('modal-open')
                document.body.style.overflow = ''
                document.body.style.paddingRight = ''
              }, { once: true })
            })
          }
        }, 100)
      }
    })

    watch(showNewTenantModal, (show) => {
      if (show) {
        setTimeout(() => {
          const modalElement = document.getElementById('newTenantModal')
          if (modalElement) {
            import('bootstrap').then(bootstrap => {
              const modal = new bootstrap.Modal(modalElement, {
                backdrop: true,
                keyboard: true
              })
              modal.show()
              
              // Handle modal hidden event
              modalElement.addEventListener('hidden.bs.modal', () => {
                showNewTenantModal.value = false
                // Clean up any remaining backdrop
                const backdrop = document.querySelector('.modal-backdrop')
                if (backdrop) {
                  backdrop.remove()
                }
                document.body.classList.remove('modal-open')
                document.body.style.overflow = ''
                document.body.style.paddingRight = ''
              }, { once: true })
            })
          }
        }, 100)
      }
    })

    watch(showNewLandlordModal, (show) => {
      if (show) {
        setTimeout(() => {
          const modalElement = document.getElementById('newLandlordModal')
          if (modalElement) {
            import('bootstrap').then(bootstrap => {
              const modal = new bootstrap.Modal(modalElement, {
                backdrop: true,
                keyboard: true
              })
              modal.show()
              
              // Handle modal hidden event
              modalElement.addEventListener('hidden.bs.modal', () => {
                showNewLandlordModal.value = false
                // Clean up any remaining backdrop
                const backdrop = document.querySelector('.modal-backdrop')
                if (backdrop) {
                  backdrop.remove()
                }
                document.body.classList.remove('modal-open')
                document.body.style.overflow = ''
                document.body.style.paddingRight = ''
              }, { once: true })
            })
          }
        }, 100)
      }
    })

    return {
      loading,
      errors,
      formData,
      isEditing,
      availableProperties,
      availableTenants,
      availableLandlords,
      availableTenantsForSelection,
      availableLandlordsForSelection,
      selectedProperty,
      selectedTenant,
      selectedLandlord,
      selectedTenants,
      selectedLandlords,
      leaseTermText,
      isFormValid,
      getTenantName,
      getLandlordName,
      addTenant,
      removeTenant,
      addLandlord,
      removeLandlord,
      goBack,
      formatDate,
      getStatusBadgeClass,
      submitForm,
      // Modal related
      showNewPropertyModal,
      showNewTenantModal,
      showNewLandlordModal,
      creatingProperty,
      creatingTenant,
      creatingLandlord,
      newProperty,
      newTenant,
      newLandlord,
      newPropertyErrors,
      newTenantErrors,
      newLandlordErrors,
      closeNewPropertyModal,
      closeNewTenantModal,
      closeNewLandlordModal,
      createProperty,
      createTenant,
      createLandlord
    }
  }
}
</script>

<style scoped>
.card {
  border: 1px solid #e9ecef;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.form-label {
  font-weight: 500;
  color: #495057;
}

.input-group-text {
  background-color: #f8f9fa;
  border-color: #ced4da;
  color: #6c757d;
}

.badge {
  font-size: 0.75rem;
  padding: 0.375rem 0.5rem;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
}

.position-sticky {
  position: sticky !important;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .position-sticky {
    position: relative !important;
  }
}

/* Input group improvements */
.input-group .btn {
  border-left: 0;
}

.input-group .form-select:focus + .btn {
  border-color: #86b7fe;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}
</style>
