<template>
  <div class="modal fade" :id="modalId" tabindex="-1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-envelope me-2"></i>
            Compose Email
          </h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="sendEmail">
            <!-- Recipient Selection -->
            <div class="mb-3">
              <label class="form-label">Recipients *</label>
              <div class="recipient-selector mb-2">
                <div class="btn-group" role="group">
                  <input 
                    type="radio" 
                    class="btn-check" 
                    name="recipientType" 
                    id="manual" 
                    value="manual"
                    v-model="recipientType"
                  >
                  <label class="btn btn-outline-secondary" for="manual">
                    <i class="bi bi-person me-1"></i>
                    Manual
                  </label>
                  
                  <input 
                    type="radio" 
                    class="btn-check" 
                    name="recipientType" 
                    id="contacts" 
                    value="contacts"
                    v-model="recipientType"
                  >
                  <label class="btn btn-outline-secondary" for="contacts">
                    <i class="bi bi-people me-1"></i>
                    From Contacts
                  </label>
                  
                  <input 
                    type="radio" 
                    class="btn-check" 
                    name="recipientType" 
                    id="lease" 
                    value="lease"
                    v-model="recipientType"
                    v-if="availableLeases.length > 0"
                  >
                  <label class="btn btn-outline-secondary" for="lease" v-if="availableLeases.length > 0">
                    <i class="bi bi-file-text me-1"></i>
                    Lease Parties
                  </label>
                </div>
              </div>

              <!-- Manual Email Input -->
              <div v-if="recipientType === 'manual'" class="mb-2">
                <input
                  v-model="manualRecipients"
                  type="text"
                  class="form-control"
                  placeholder="Enter email addresses separated by commas"
                  :class="{ 'is-invalid': errors.recipients }"
                >
                <div class="form-text">
                  Enter multiple email addresses separated by commas
                </div>
              </div>

              <!-- Contact Selection -->
              <div v-if="recipientType === 'contacts'" class="mb-2">
                <div class="contact-selection">
                  <div class="input-group mb-2">
                    <input
                      v-model="contactSearch"
                      type="text"
                      class="form-control"
                      placeholder="Search contacts..."
                      @input="searchContacts"
                    >
                    <button class="btn btn-outline-secondary" type="button" @click="loadAllContacts">
                      <i class="bi bi-arrow-clockwise"></i>
                    </button>
                  </div>
                  
                  <div class="contact-list" style="max-height: 200px; overflow-y: auto;">
                    <div 
                      v-for="contact in filteredContacts" 
                      :key="contact.id"
                      class="form-check"
                    >
                      <input
                        class="form-check-input"
                        type="checkbox"
                        :id="`contact-${contact.id}`"
                        :value="contact"
                        v-model="selectedContacts"
                      >
                      <label class="form-check-label" :for="`contact-${contact.id}`">
                        <div class="d-flex align-items-center">
                          <div class="contact-avatar me-2">
                            {{ getContactInitials(contact) }}
                          </div>
                          <div>
                            <div class="fw-medium">{{ contact.first_name }} {{ contact.last_name }}</div>
                            <small class="text-muted">{{ contact.email }}</small>
                            <span class="badge badge-sm ms-1" :class="getContactTypeBadge(contact.contact_type)">
                              {{ formatContactType(contact.contact_type) }}
                            </span>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  <div v-if="filteredContacts.length === 0 && contactSearch" class="text-muted text-center py-2">
                    No contacts found matching "{{ contactSearch }}"
                  </div>
                </div>
              </div>

              <!-- Lease Selection -->
              <div v-if="recipientType === 'lease'" class="mb-2">
                <select v-model="selectedLease" class="form-select mb-2" @change="loadLeaseParties">
                  <option value="">Select a lease...</option>
                  <option v-for="lease in availableLeases" :key="lease.id" :value="lease">
                    {{ lease.property?.title || 'Unknown Property' }} - 
                    {{ lease.tenant ? `${lease.tenant.first_name} ${lease.tenant.last_name}` : 'No Tenant' }}
                  </option>
                </select>

                <div v-if="selectedLease" class="lease-parties">
                  <h6 class="mb-2">Select Recipients:</h6>
                  <div class="form-check" v-if="selectedLease.tenant">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="tenant"
                      v-model="includeParties.tenant"
                    >
                    <label class="form-check-label" for="tenant">
                      <strong>Tenant:</strong> {{ selectedLease.tenant.first_name }} {{ selectedLease.tenant.last_name }}
                      <small class="text-muted d-block">{{ selectedLease.tenant.email }}</small>
                    </label>
                  </div>
                  
                  <div class="form-check" v-if="selectedLease.landlord">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="landlord"
                      v-model="includeParties.landlord"
                    >
                    <label class="form-check-label" for="landlord">
                      <strong>Landlord:</strong> {{ selectedLease.landlord.first_name }} {{ selectedLease.landlord.last_name }}
                      <small class="text-muted d-block">{{ selectedLease.landlord.email }}</small>
                    </label>
                  </div>
                  
                  <div class="form-check" v-if="selectedLease.realtor">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="realtor"
                      v-model="includeParties.realtor"
                    >
                    <label class="form-check-label" for="realtor">
                      <strong>Realtor:</strong> {{ selectedLease.realtor.first_name }} {{ selectedLease.realtor.last_name }}
                      <small class="text-muted d-block">{{ selectedLease.realtor.email }}</small>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Selected Recipients Display -->
              <div v-if="computedRecipients.length > 0" class="selected-recipients">
                <h6 class="mb-2">Selected Recipients ({{ computedRecipients.length }}):</h6>
                <div class="recipient-tags">
                  <span 
                    v-for="recipient in computedRecipients" 
                    :key="recipient.email"
                    class="badge bg-primary me-1 mb-1"
                  >
                    {{ recipient.name }} &lt;{{ recipient.email }}&gt;
                    <button 
                      type="button" 
                      class="btn-close btn-close-white ms-1" 
                      @click="removeRecipient(recipient)"
                      style="font-size: 0.6em;"
                    ></button>
                  </span>
                </div>
              </div>

              <div v-if="errors.recipients" class="invalid-feedback d-block">
                {{ errors.recipients }}
              </div>
            </div>

            <!-- Email Template Selection -->
            <div class="mb-3">
              <label class="form-label">Email Template</label>
              <select v-model="selectedTemplate" class="form-select" @change="loadTemplate">
                <option value="">Custom Email</option>
                <option value="lease_reminder_90">Lease Reminder (90 Days)</option>
                <option value="lease_reminder_60">Lease Reminder (60 Days)</option>
                <option value="lease_reminder_30">Lease Reminder (30 Days)</option>
                <option value="lease_renewal">Lease Renewal Discussion</option>
                <option value="property_inspection">Property Inspection Notice</option>
                <option value="maintenance_request">Maintenance Request</option>
                <option value="general_notice">General Notice</option>
              </select>
            </div>

            <!-- Subject -->
            <div class="mb-3">
              <label for="subject" class="form-label">Subject *</label>
              <input
                id="subject"
                v-model="email.subject"
                type="text"
                class="form-control"
                :class="{ 'is-invalid': errors.subject }"
                placeholder="Enter email subject"
              >
              <div v-if="errors.subject" class="invalid-feedback">
                {{ errors.subject }}
              </div>
            </div>

            <!-- Message -->
            <div class="mb-3">
              <label for="message" class="form-label">Message *</label>
              <textarea
                id="message"
                v-model="email.message"
                class="form-control"
                rows="8"
                :class="{ 'is-invalid': errors.message }"
                placeholder="Enter your message here..."
              ></textarea>
              <div v-if="errors.message" class="invalid-feedback">
                {{ errors.message }}
              </div>
              <div class="form-text">
                You can use variables like {tenant_name}, {landlord_name}, {property_address}, {lease_end_date} for lease-related emails
              </div>
            </div>

            <!-- Priority -->
            <div class="mb-3">
              <label class="form-label">Priority</label>
              <select v-model="email.priority" class="form-select">
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="low">Low</option>
              </select>
            </div>

            <!-- Copy Options -->
            <div class="mb-3">
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="copyToSelf"
                  v-model="email.copyToSelf"
                >
                <label class="form-check-label" for="copyToSelf">
                  Send a copy to myself
                </label>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            Cancel
          </button>
          <button 
            type="button" 
            class="btn btn-primary" 
            @click="sendEmail"
            :disabled="loading || computedRecipients.length === 0"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="bi bi-send me-2"></i>
            Send Email
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useContactStore } from '@/stores/contactStore'
import { useLeaseStore } from '@/stores/leaseStore'
import emailService from '@/services/emailService'

export default {
  name: 'EmailComposer',
  props: {
    modalId: {
      type: String,
      default: 'emailComposerModal'
    },
    preSelectedContacts: {
      type: Array,
      default: () => []
    },
    preSelectedLease: {
      type: Object,
      default: null
    },
    presetTemplate: {
      type: String,
      default: ''
    }
  },
  emits: ['email-sent', 'email-failed'],
  setup(props, { emit }) {
    const contactStore = useContactStore()
    const leaseStore = useLeaseStore()
    
    const { contacts, loading: contactsLoading } = storeToRefs(contactStore)
    const { leases } = storeToRefs(leaseStore)

    // Form data
    const recipientType = ref('manual')
    const manualRecipients = ref('')
    const selectedContacts = ref([])
    const selectedLease = ref(null)
    const includeParties = ref({
      tenant: false,
      landlord: false,
      realtor: false
    })
    const contactSearch = ref('')
    const selectedTemplate = ref('')
    const email = ref({
      subject: '',
      message: '',
      priority: 'normal',
      copyToSelf: false
    })

    // State
    const loading = ref(false)
    const errors = ref({})
    const availableContacts = ref([])

    // Computed
    const filteredContacts = computed(() => {
      if (!contactSearch.value) return availableContacts.value
      const query = contactSearch.value.toLowerCase()
      return availableContacts.value.filter(contact => 
        `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query)
      )
    })

    const availableLeases = computed(() => {
      return leases.value.filter(lease => 
        lease.status === 'active' && 
        (lease.tenant || lease.landlord || lease.realtor)
      )
    })

    const computedRecipients = computed(() => {
      const recipients = []

      if (recipientType.value === 'manual' && manualRecipients.value) {
        const emails = manualRecipients.value.split(',').map(email => email.trim()).filter(email => email)
        emails.forEach(email => {
          if (isValidEmail(email)) {
            recipients.push({ email, name: email })
          }
        })
      }

      if (recipientType.value === 'contacts') {
        selectedContacts.value.forEach(contact => {
          recipients.push({
            email: contact.email,
            name: `${contact.first_name} ${contact.last_name}`,
            contact
          })
        })
      }

      if (recipientType.value === 'lease' && selectedLease.value) {
        if (includeParties.value.tenant && selectedLease.value.tenant) {
          recipients.push({
            email: selectedLease.value.tenant.email,
            name: `${selectedLease.value.tenant.first_name} ${selectedLease.value.tenant.last_name}`,
            role: 'tenant',
            contact: selectedLease.value.tenant
          })
        }
        if (includeParties.value.landlord && selectedLease.value.landlord) {
          recipients.push({
            email: selectedLease.value.landlord.email,
            name: `${selectedLease.value.landlord.first_name} ${selectedLease.value.landlord.last_name}`,
            role: 'landlord',
            contact: selectedLease.value.landlord
          })
        }
        if (includeParties.value.realtor && selectedLease.value.realtor) {
          recipients.push({
            email: selectedLease.value.realtor.email,
            name: `${selectedLease.value.realtor.first_name} ${selectedLease.value.realtor.last_name}`,
            role: 'realtor',
            contact: selectedLease.value.realtor
          })
        }
      }

      // Remove duplicates
      const uniqueRecipients = recipients.filter((recipient, index, self) =>
        index === self.findIndex(r => r.email === recipient.email)
      )

      return uniqueRecipients
    })

    // Methods
    const isValidEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    }

    const getContactInitials = (contact) => {
      return `${contact.first_name?.charAt(0) || ''}${contact.last_name?.charAt(0) || ''}`.toUpperCase()
    }

    const formatContactType = (type) => {
      const types = {
        tenant: 'Tenant',
        landlord: 'Landlord', 
        both: 'Both'
      }
      return types[type] || type
    }

    const getContactTypeBadge = (type) => {
      const badges = {
        tenant: 'bg-primary',
        landlord: 'bg-success',
        both: 'bg-info'
      }
      return badges[type] || 'bg-secondary'
    }

    const searchContacts = () => {
      // Trigger reactive update
    }

    const loadAllContacts = async () => {
      try {
        await contactStore.fetchContacts({ limit: 100, isActive: 'true' })
        availableContacts.value = contacts.value
      } catch (error) {
        console.error('Error loading contacts:', error)
      }
    }

    const loadLeaseParties = () => {
      if (selectedLease.value) {
        // Auto-select all available parties
        includeParties.value = {
          tenant: !!selectedLease.value.tenant,
          landlord: !!selectedLease.value.landlord,
          realtor: !!selectedLease.value.realtor
        }
      }
    }

    const removeRecipient = (recipientToRemove) => {
      if (recipientType.value === 'contacts') {
        selectedContacts.value = selectedContacts.value.filter(
          contact => contact.email !== recipientToRemove.email
        )
      } else if (recipientType.value === 'lease') {
        if (recipientToRemove.role === 'tenant') includeParties.value.tenant = false
        if (recipientToRemove.role === 'landlord') includeParties.value.landlord = false
        if (recipientToRemove.role === 'realtor') includeParties.value.realtor = false
      }
    }

    const loadTemplate = () => {
      const templates = {
        lease_reminder_90: {
          subject: 'Lease Expiration Reminder - 90 Days Notice',
          message: `Dear {recipient_name},

This is to inform you that the lease for {property_address} will expire on {lease_end_date}, which is approximately 90 days from today.

Please consider the following:
• Review the current lease terms
• Discuss renewal options if interested
• Schedule a property inspection if needed
• Consider market rental rates for renewal negotiations

If you have any questions or would like to discuss lease renewal, please don't hesitate to contact me.

Best regards,
{sender_name}`
        },
        lease_reminder_60: {
          subject: 'Lease Expiration Reminder - 60 Days Notice',
          message: `Dear {recipient_name},

This is a reminder that the lease for {property_address} will expire on {lease_end_date}, which is approximately 60 days from today.

Action items:
• Please confirm your intention to renew or terminate the lease
• If renewing, we can begin preparing the new lease agreement
• If not renewing, please review move-out procedures
• Schedule any necessary property inspections

Please respond at your earliest convenience so we can plan accordingly.

Best regards,
{sender_name}`
        },
        lease_reminder_30: {
          subject: 'Lease Expiration Reminder - 30 Days FINAL Notice',
          message: `Dear {recipient_name},

IMPORTANT: The lease for {property_address} will expire on {lease_end_date}, which is only 30 days away.

Immediate action required:
• Confirm lease renewal or termination plans
• Complete lease renewal paperwork if applicable
• Begin move-out preparations if not renewing
• Schedule final property inspection

This is your final reminder. Please contact me immediately to discuss your plans.

Best regards,
{sender_name}`
        },
        lease_renewal: {
          subject: 'Lease Renewal Discussion for {property_address}',
          message: `Dear {recipient_name},

I hope this message finds you well. As your lease for {property_address} approaches its expiration date of {lease_end_date}, I wanted to reach out to discuss renewal options.

We would love to continue our rental relationship and are prepared to offer competitive renewal terms. 

Would you be available for a brief conversation to discuss:
• Lease renewal terms and duration
• Any maintenance or improvement requests
• Updated rental rates for the area

Please let me know your availability for a discussion.

Best regards,
{sender_name}`
        },
        property_inspection: {
          subject: 'Property Inspection Notice for {property_address}',
          message: `Dear {recipient_name},

This notice serves to inform you that we will be conducting a property inspection at {property_address}.

Inspection details:
• Purpose: Routine maintenance and lease compliance check
• Duration: Approximately 30-60 minutes
• Areas to inspect: All rooms and common areas

Please let me know if you have any questions or concerns about this inspection.

Best regards,
{sender_name}`
        },
        maintenance_request: {
          subject: 'Maintenance Request Follow-up for {property_address}',
          message: `Dear {recipient_name},

I wanted to follow up regarding the maintenance request for {property_address}.

Please provide details about:
• Nature of the maintenance issue
• Urgency level (emergency, urgent, routine)
• Preferred timing for repairs
• Any specific instructions or access requirements

We will coordinate with our maintenance team and get back to you with a scheduled time.

Best regards,
{sender_name}`
        },
        general_notice: {
          subject: 'Important Notice Regarding {property_address}',
          message: `Dear {recipient_name},

I hope this message finds you well. I am writing to inform you about an important matter regarding {property_address}.

[Please customize this message with your specific notice details]

If you have any questions or concerns, please don't hesitate to contact me.

Best regards,
{sender_name}`
        }
      }

      if (templates[selectedTemplate.value]) {
        email.value.subject = templates[selectedTemplate.value].subject
        email.value.message = templates[selectedTemplate.value].message
      }
    }

    const validateForm = () => {
      errors.value = {}

      if (computedRecipients.value.length === 0) {
        errors.value.recipients = 'Please select at least one recipient'
      }

      if (!email.value.subject.trim()) {
        errors.value.subject = 'Subject is required'
      }

      if (!email.value.message.trim()) {
        errors.value.message = 'Message is required'
      }

      return Object.keys(errors.value).length === 0
    }

    const processMessageVariables = (message, recipient, lease) => {
      let processedMessage = message

      // Basic recipient variables
      processedMessage = processedMessage.replace(/{recipient_name}/g, recipient.name)

      // Lease-specific variables
      if (lease) {
        processedMessage = processedMessage.replace(/{property_address}/g, 
          lease.property ? `${lease.property.street || ''}, ${lease.property.city || ''}, ${lease.property.state || ''}`.trim() : 'Unknown Property')
        processedMessage = processedMessage.replace(/{lease_end_date}/g, 
          lease.end_date ? new Date(lease.end_date).toLocaleDateString() : 'Unknown Date')
        processedMessage = processedMessage.replace(/{tenant_name}/g, 
          lease.tenant ? `${lease.tenant.first_name} ${lease.tenant.last_name}` : 'Unknown Tenant')
        processedMessage = processedMessage.replace(/{landlord_name}/g, 
          lease.landlord ? `${lease.landlord.first_name} ${lease.landlord.last_name}` : 'Unknown Landlord')
      }

      // Sender variables (you can customize this based on current user)
      processedMessage = processedMessage.replace(/{sender_name}/g, 'Your Real Estate Team')

      return processedMessage
    }

    const sendEmail = async () => {
      if (!validateForm()) return

      loading.value = true
      
      try {
        const emailData = {
          recipients: computedRecipients.value.map(r => ({
            email: r.email,
            name: r.name
          })),
          subject: email.value.subject,
          message: email.value.message,
          priority: email.value.priority,
          copyToSelf: email.value.copyToSelf,
          lease: selectedLease.value,
          template: selectedTemplate.value
        }

        // Process message variables for each recipient
        const processedEmails = computedRecipients.value.map(recipient => ({
          to: recipient.email,
          subject: email.value.subject,
          message: processMessageVariables(email.value.message, recipient, selectedLease.value),
          priority: email.value.priority
        }))

        await emailService.sendEmails(processedEmails)
        
        emit('email-sent', {
          recipients: computedRecipients.value,
          subject: email.value.subject,
          count: computedRecipients.value.length
        })

        // Reset form
        resetForm()
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById(props.modalId))
        modal?.hide()

      } catch (error) {
        console.error('Error sending email:', error)
        emit('email-failed', error)
      } finally {
        loading.value = false
      }
    }

    const resetForm = () => {
      recipientType.value = 'manual'
      manualRecipients.value = ''
      selectedContacts.value = []
      selectedLease.value = null
      includeParties.value = { tenant: false, landlord: false, realtor: false }
      contactSearch.value = ''
      selectedTemplate.value = ''
      email.value = {
        subject: '',
        message: '',
        priority: 'normal',
        copyToSelf: false
      }
      errors.value = {}
    }

    // Initialize
    onMounted(async () => {
      await Promise.all([
        loadAllContacts(),
        leaseStore.fetchLeases({ limit: 100 })
      ])

      // Handle props
      if (props.preSelectedContacts.length > 0) {
        recipientType.value = 'contacts'
        selectedContacts.value = props.preSelectedContacts
      }

      if (props.preSelectedLease) {
        recipientType.value = 'lease'
        selectedLease.value = props.preSelectedLease
        loadLeaseParties()
      }

      if (props.presetTemplate) {
        selectedTemplate.value = props.presetTemplate
        loadTemplate()
      }
    })

    return {
      recipientType,
      manualRecipients,
      selectedContacts,
      selectedLease,
      includeParties,
      contactSearch,
      selectedTemplate,
      email,
      loading,
      errors,
      availableContacts,
      filteredContacts,
      availableLeases,
      computedRecipients,
      getContactInitials,
      formatContactType,
      getContactTypeBadge,
      searchContacts,
      loadAllContacts,
      loadLeaseParties,
      removeRecipient,
      loadTemplate,
      sendEmail,
      resetForm
    }
  }
}
</script>

<style scoped>
.recipient-selector {
  margin-bottom: 1rem;
}

.contact-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 12px;
}

.contact-list {
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 0.5rem;
}

.form-check {
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: background-color 0.15s;
}

.form-check:hover {
  background-color: #f8f9fa;
}

.selected-recipients {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 1rem;
  margin-top: 1rem;
}

.recipient-tags .badge {
  font-size: 0.75rem;
  padding: 0.5rem 0.75rem;
}

.lease-parties {
  background-color: #f8f9fa;
  border-radius: 0.375rem;
  padding: 1rem;
}

.badge-sm {
  font-size: 0.6rem;
  padding: 0.25rem 0.4rem;
}

.btn-close-white {
  filter: invert(1) grayscale(100%) brightness(200%);
}
</style>
