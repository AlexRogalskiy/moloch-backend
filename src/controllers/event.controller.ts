import {
  repository,
} from '@loopback/repository';
import {
  post,
  get,
  requestBody,
} from '@loopback/rest';
import {
  Event,
  Member,
  Period,
  Project
} from '../models';
import {
  EventRepository,
  MemberRepository,
  PeriodRepository,
  ProjectRepository
} from '../repositories';

export class EventController {
  constructor(
    @repository(EventRepository)
    public eventRepository: EventRepository,
    @repository(MemberRepository)
    public memberRepository: MemberRepository,
    @repository(PeriodRepository)
    public periodRepository: PeriodRepository,
    @repository(ProjectRepository)
    public projectRepository: ProjectRepository,
  ) { }

  /**
   * Returns all existing events.
   */
  @get('/events', {
    responses: {
      '200': {
        description: 'Returned all events.',
        content: {
          'application/json': {
            schema: { type: 'array', items: { 'x-ts-type': Event } },
          },
        },
      },
    },
  })
  async findAll(): Promise<Event[]> {
    return await this.eventRepository.find();
  }

  /**
   * Creates a event.
   * @param event: event to be created.
   */
  @post('/events', {
    responses: {
      '200': {
        description: 'Event created.',
        content: { 'application/json': { schema: { 'x-ts-type': Event } } },
      },
    },
  })
  async create(@requestBody() event: Event): Promise<Event> {
    var S4 = function () {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    event.id = (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    switch (event.name) {
      case 'User creation':
        var memberCreate = event.payload as Member;
        memberCreate.nonce = Math.floor(Math.random() * 1000000);
        return await this.memberRepository.create(memberCreate).then(async result => {
          return await this.eventRepository.create(event);
        });
      case 'Membership proposal':
        var memberPatch = event.payload as Member;
        memberPatch.name = memberPatch.address;
        memberPatch.status = 'pending';
        memberPatch.voters = [];
        memberPatch.proposals = [];
        memberPatch.period = 0;
        return await this.memberRepository.updateById(memberPatch.address, memberPatch).then(async result => {
          return await this.eventRepository.create(event);
        });
      case 'Project proposal':
        var projectCreate = event.payload as Project;
        projectCreate.id = (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
        projectCreate.status = 'pending';
        projectCreate.period = 0;
        return await this.projectRepository.create(projectCreate).then(async result => {
          return await this.eventRepository.create(event);
        });
      case 'Project proposal voted':
        var projectVoted = event.payload as Project;
        return await this.projectRepository.updateById(projectVoted.id, projectVoted).then(async result => {
          return await this.eventRepository.create(event);
        });
      case 'Project proposal processed':
        var projectProcessed = event.payload as Project;
        projectProcessed.status = 'accepted';
        return await this.projectRepository.updateById(projectProcessed.id, projectProcessed).then(async result => {
          return await this.eventRepository.create(event);
        });
      case 'Period creation':
        var periodCreated = event.payload as Period;
        periodCreated.id = (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
        return await this.periodRepository.create(periodCreated).then(async result => {
          return await this.eventRepository.create(event);
        });
    }
    return await this.eventRepository.create(event).then(result => { return event });
  }
}
